//check apakah user mengakses data miliknya sendiri
//error dengan custom error
const { BadRequestError, UnauthorizedError } = require('../helpers/customErrors');
module.exports = (req, res, next) => {
  try {
    const userIdFromToken = req.user.id; // Asumsikan userId diambil dari token yang sudah terverifikasi
    const userIdFromParams = parseInt(req.params.id, 10); // Asumsikan userId diambil dari parameter URL
    if (isNaN(userIdFromParams) || userIdFromParams <= 0) {
      throw new BadRequestError('Invalid User ID');
    }
    if (userIdFromToken !== userIdFromParams) {
      throw new UnauthorizedError('You are not authorized to access this resource');
    }
    next();
  } catch (error) {
    next(error);
  }
};
