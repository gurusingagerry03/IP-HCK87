export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/5 py-8 bg-[#1a1a1a]">
      <div className="mx-auto max-w-[1800px] 2xl:max-w-[1700px] px-4 sm:px-6 lg:px-10 2xl:px-14">
        <div className="text-center">
          <p className="text-white/50 text-sm">
            © {currentYear} Ninety Minutes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
