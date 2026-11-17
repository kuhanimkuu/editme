import { Link } from 'react-router';
import { Home, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

export function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-[#9333ea] via-[#ec4899] to-[#f97316] bg-clip-text text-transparent">
            404
          </h1>
        </div>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="rounded-xl border-gray-200">
              <Search className="w-4 h-4 mr-2" />
              Discover Talent
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
