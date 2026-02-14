export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            © {new Date().getFullYear()} Laughtale. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            Built with Next.js, TypeScript, and Tailwind CSS by Thulani Langa
          </p>
        </div>
      </div>
    </footer>
  )
}