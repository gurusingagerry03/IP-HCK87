const { Team, League, Player } = require('../models');
const { http } = require('../helpers/http');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError } = require('../helpers/customErrors');
const { generateAi } = require('../helpers/aiGenerate');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECREAT,
});

class teamController {
  static async uploadImageUrlTeam(req, res, next) {
    try {
      const { id } = req.params;
      const files = req.files; // Now we get array of files

      // Validate tea m exists
      const team = await Team.findByPk(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }
      console.log(team);

      // Check if files are provided
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided',
        });
      }

      // Get current images count
      const currentImages = team.imgUrls || [];
      const totalImagesAfterUpload = currentImages.length + files.length;

      // Check if total images will exceed 4
      if (totalImagesAfterUpload > 4) {
        return res.status(400).json({
          success: false,
          message: `Cannot upload ${files.length} images. Team already has ${currentImages.length} images. Maximum allowed is 4 images per team.`,
        });
      }

      // Upload all images to Cloudinary (Modern way - no Promise wrapper needed)
      const uploadPromises = files.map(async (file) => {
        const base64Image = file.buffer.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${base64Image}`;

        // Cloudinary returns Promise when no callback provided
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'FOOTBALL_DB/team-images',
        });

        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      });

      // Execute all uploads
      const uploadResults = await Promise.all(uploadPromises);

      // Update team with new images (append to existing array)
      const updatedImages = [...currentImages, ...uploadResults];
      await team.update({ imgUrls: updatedImages });

      res.status(200).json({
        success: true,
        message: `Successfully uploaded ${uploadResults.length} images`,
        data: {
          teamId: team.id,
          teamName: team.name,
          totalImages: updatedImages.length,
          newImages: uploadResults,
        },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async getAllTeams(req, res, next) {
    try {
      const {
        q: search,
        filter: country,
        sort = 'name',
        'page[number]': pageNumber = 1,
        'page[size]': pageSize = 10,
      } = req.query;

      let whereCondition = {};

      if (search?.trim()) {
        whereCondition = {
          ...whereCondition,
          [Op.or]: [
            { name: { [Op.iLike]: `%${search.trim()}%` } },
            { country: { [Op.iLike]: `%${search.trim()}%` } },
          ],
        };
      }

      if (country?.trim()) {
        whereCondition.country = {
          [Op.iLike]: `%${country.trim()}%`,
        };
      }

      // Check if there are any query parameters for pagination or filtering
      const hasQueryParams =
        search || country || req.query['page[number]'] || req.query['page[size]'];

      let findOptions = {
        where: whereCondition,
        order: [[sort, 'ASC']],
        include: [
          {
            model: League,
            attributes: ['id', 'name', 'country'],
          },
        ],
      };

      let totalPages = 1;
      let currentPage = 1;

      // Only apply pagination if there are query parameters
      if (hasQueryParams) {
        const limit = Math.min(parseInt(pageSize), 50);
        const offset = (parseInt(pageNumber) - 1) * limit;
        findOptions.limit = limit;
        findOptions.offset = offset;

        const { count, rows } = await Team.findAndCountAll(findOptions);
        totalPages = Math.ceil(count / limit);
        currentPage = parseInt(pageNumber);

        return res.status(200).json({
          data: rows,
          meta: {
            page: currentPage,
            totalPages: totalPages,
            total: count,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1,
          },
        });
      }

      // If no query parameters, return all data without pagination
      const { count, rows } = await Team.findAndCountAll(findOptions);

      res.status(200).json({
        data: rows,
        meta: {
          page: 1,
          totalPages: 1,
          total: count,
          hasNext: false,
          hasPrev: false,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw new BadRequestError('Team ID must be a positive number');
      }

      const team = await Team.findByPk(parseInt(id), {
        include: [
          {
            model: League,
          },
          {
            model: Player,
          },
        ],
      });

      if (!team) {
        throw new NotFoundError(`Team with ID ${id} not found`);
      }

      res.status(200).json(team);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async synchronizeTeamsAndPlayersFromAPI(req, res, next) {
    try {
      const { leagueId } = req.params;

      if (!leagueId) {
        throw new BadRequestError('League ID is required');
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        throw new NotFoundError('League not found');
      }

      let teamsResponse;
      try {
        teamsResponse = await http('/', {
          params: {
            action: 'get_teams',
            league_id: league.externalRef || league.id,
          },
        });
      } catch (apiError) {
        throw new BadRequestError('Failed to connect to external team API');
      }

      if (!teamsResponse.data || !Array.isArray(teamsResponse.data)) {
        throw new BadRequestError('Invalid response from external API');
      }

      const syncResults = {
        totalTeam: 0,
        totalPlayer: 0,
        errors: [],
      };

      try {
        // DEDUPLICATION: Remove duplicate teams berdasarkan externalRef
        const uniqueTeamsMap = new Map();
        teamsResponse.data.forEach((apiTeamData) => {
          if (!uniqueTeamsMap.has(apiTeamData.team_key)) {
            uniqueTeamsMap.set(apiTeamData.team_key, apiTeamData);
          }
        });

        // OPTIMASI: Bulk create/update teams dengan bulkCreate
        const teamsData = Array.from(uniqueTeamsMap.values()).map((apiTeamData) => ({
          leagueId: leagueId,
          name: apiTeamData.team_name,
          logoUrl: apiTeamData.team_badge || null,
          foundedYear: apiTeamData.team_founded ? parseInt(apiTeamData.team_founded) : null,
          country: apiTeamData.team_country || league.country,
          stadiumName: apiTeamData.venue?.venue_name || null,
          venueAddress: apiTeamData.venue?.venue_address || null,
          stadiumCity: apiTeamData.venue?.venue_city || null,
          stadiumCapacity: apiTeamData.venue?.venue_capacity
            ? parseInt(apiTeamData.venue.venue_capacity)
            : null,
          coach: apiTeamData.coaches?.[0]?.coach_name || null,
          externalRef: apiTeamData.team_key,
          lastSyncedAt: new Date(),
        }));

        // Bulk create/update teams dengan field yang benar
        const teamResults = await Team.bulkCreate(teamsData, {
          updateOnDuplicate: [
            'name',
            'logoUrl',
            'foundedYear',
            'country',
            'stadiumName',
            'venueAddress',
            'stadiumCity',
            'stadiumCapacity',
            'coach',
            'lastSyncedAt',
          ],
          returning: true,
        });

        syncResults.totalTeam = teamResults.filter((result) => result._options.isNewRecord).length;

        // OPTIMASI: Bulk create/update players dengan deduplication
        const uniquePlayersMap = new Map();

        // Use unique teams data instead of original response
        for (const apiTeamData of Array.from(uniqueTeamsMap.values())) {
          if (apiTeamData.players && Array.isArray(apiTeamData.players)) {
            // Find team ID dari hasil bulk create
            const team = teamResults.find((t) => t.externalRef === apiTeamData.team_key);

            if (team) {
              // DEDUPLICATION: Remove duplicate players berdasarkan externalRef
              apiTeamData.players.forEach((apiPlayerData) => {
                if (!uniquePlayersMap.has(apiPlayerData.player_id)) {
                  uniquePlayersMap.set(apiPlayerData.player_id, {
                    fullName: apiPlayerData.player_name,
                    primaryPosition: apiPlayerData.player_type || null,
                    thumbUrl: apiPlayerData.player_image || null,
                    externalRef: apiPlayerData.player_id,
                    age: apiPlayerData.player_age ? parseInt(apiPlayerData.player_age) : null,
                    teamId: team.id,
                    shirtNumber: apiPlayerData.player_number
                      ? parseInt(apiPlayerData.player_number)
                      : null,
                  });
                }
              });
            }
          }
        }

        // Convert map to array untuk bulk create
        const uniquePlayersData = Array.from(uniquePlayersMap.values());

        if (uniquePlayersData.length > 0) {
          // Bulk create/update players
          const playerResults = await Player.bulkCreate(uniquePlayersData, {
            updateOnDuplicate: [
              'fullName',
              'primaryPosition',
              'thumbUrl',
              'age',
              'teamId',
              'shirtNumber',
            ],
            returning: true,
          });

          syncResults.totalPlayer = playerResults.filter(
            (result) => result._options.isNewRecord
          ).length;
        }
      } catch (bulkError) {
        console.error('Bulk operation error:', bulkError);
        syncResults.errors.push(`Bulk operation failed: ${bulkError.message}`);
      }

      return res.status(200).json({
        success: true,
        data: syncResults,
        message: 'Teams and players synchronization completed',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async deleteTeamImage(req, res, next) {
    try {
      const { id, imageIndex } = req.params;

      // Validate team exists
      const team = await Team.findByPk(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      // Check if team has images
      const currentImages = team.imgUrls || [];
      if (currentImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Team has no images to delete',
        });
      }

      // Validate image index
      const index = parseInt(imageIndex);
      if (isNaN(index) || index < 0 || index >= currentImages.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image index',
        });
      }

      // Get image to delete
      const imageToDelete = currentImages[index];

      // Delete from Cloudinary if public_id exists
      if (imageToDelete.public_id) {
        try {
          await cloudinary.uploader.destroy(imageToDelete.public_id);
        } catch (cloudinaryError) {
          console.log('Cloudinary deletion error:', cloudinaryError);
        }
      }

      // Remove image from array
      const updatedImages = currentImages.filter((_, i) => i !== index);

      // Update team
      await team.update({ imgUrls: updatedImages });

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        data: {
          teamId: team.id,
          teamName: team.name,
          remainingImages: updatedImages.length,
          deletedImage: imageToDelete,
        },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  // update description team by id
  static async updateTeamDescription(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw new BadRequestError('Team ID must be a positive number');
      }
      const team = await Team.findByPk(parseInt(id));
      if (!team) {
        throw new NotFoundError(`Team with ID ${id} not found`);
      }

      const prompt = ` Generate a professional club information description for this football team. 
                Keep it exactly 2-3 sentences, around 50-70 words maximum.
                Include: team name, location, founding year, and brief history/characteristics.
                DO NOT mention stadium name or capacity.
                Make it sound professional and informative like a club profile.
                
                Team Details:
                - Name: ${team.name}
                - Country: ${team.country}  
                - Founded: ${team.foundedYear}
                - Coach: ${team.coach || 'N/A'}

                Example format: "[Team] is a professional football club based in [City], [Country]. Founded in [Year], the club has a rich history and continues to compete at the highest level of football."`;
      // If description already exists, skip regeneration
      if (team.description) {
        return res.status(200).json({
          message: 'Team description already exists, skipping regeneration',
        });
      }

      const desc = await generateAi(prompt, 'gemini-2.5-flash-lite');
      await Team.update({ description: desc }, { where: { id } });

      return res.status(200).json({
        message: 'Team description updated successfully',
      });
    } catch (error) {
      console.log(error, '<<< error generate description');

      next(error);
    }
  }
}

module.exports = teamController;
