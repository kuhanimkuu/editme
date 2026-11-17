import { useState } from 'react';
import { Briefcase, Clock, DollarSign, MessageSquare, Shield, MoreVertical, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { mockProjects } from '../data/mockData';
import { useUser } from '../context/UserContext';
import { motion } from 'motion/react';

export function Projects() {
  const { userRole } = useUser();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const statusColors = {
    'in-progress': 'bg-[#2979FF] text-white',
    'review': 'bg-[#f59e0b] text-white',
    'secured': 'bg-[#9333ea] text-white',
    'completed': 'bg-[#10b981] text-white',
  };

  const filters = ['all', 'in-progress', 'review', 'secured', 'completed'];

  const filteredProjects = selectedFilter === 'all'
    ? mockProjects
    : mockProjects.filter(p => p.status === selectedFilter);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {userRole === 'client' ? 'My Projects' : 'Active Gigs'}
            </h1>
            <p className="text-gray-600">
              {userRole === 'client' 
                ? 'Track and manage all your ongoing projects' 
                : 'Deliver exceptional work and grow your portfolio'}
            </p>
          </div>
          <Button className="bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl">
            <Briefcase className="w-4 h-4 mr-2" />
            {userRole === 'client' ? 'New Project' : 'Browse Jobs'}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <Button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full whitespace-nowrap capitalize ${
                selectedFilter === filter
                  ? 'bg-[#2979FF] hover:bg-[#1e5fd8]'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {filter.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-gray-200 rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#2979FF]" />
              </div>
            </div>
            <p className="text-3xl font-bold">3</p>
            <p className="text-xs text-gray-500 mt-1">In progress now</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Review</span>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#f59e0b]" />
              </div>
            </div>
            <p className="text-3xl font-bold">1</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting feedback</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Completed</span>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
            <p className="text-3xl font-bold">12</p>
            <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Budget</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#9333ea]" />
              </div>
            </div>
            <p className="text-3xl font-bold">$8.5K</p>
            <p className="text-xs text-gray-500 mt-1">Total allocated</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <Card className="border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${statusColors[project.status]} border-none capitalize`}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                      {project.status === 'secured' && (
                        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                          <Shield className="w-3 h-3 mr-1" />
                          Escrow
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-1">{project.title}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Collaborator */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={
                      userRole === 'client' 
                        ? project.freelancer.avatar 
                        : project.client.avatar
                    } />
                    <AvatarFallback>
                      {userRole === 'client' 
                        ? project.freelancer.name[0] 
                        : project.client.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {userRole === 'client' ? project.freelancer.name : project.client.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {userRole === 'client' ? 'Assigned Freelancer' : 'Client'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-semibold text-[#2979FF]">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#9333ea]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deadline</p>
                      <p className="font-semibold">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="font-semibold">${project.budget.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl border-gray-200">
                    View Details
                  </Button>
                  <Button className="flex-1 bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl">
                    {project.status === 'review' ? 'Review Work' : 'Continue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">
            {selectedFilter === 'all' 
              ? 'Start a new project to see it here' 
              : `No projects with status "${selectedFilter.replace('-', ' ')}"`}
          </p>
          <Button className="bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl">
            <Briefcase className="w-4 h-4 mr-2" />
            {userRole === 'client' ? 'Create Project' : 'Find Work'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
