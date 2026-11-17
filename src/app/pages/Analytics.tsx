import { TrendingUp, DollarSign, Star, Eye, Award, Target, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useUser } from '../context/UserContext';
import { statsData } from '../data/mockData';
import { motion } from 'motion/react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const earningsData = [
  { month: 'Jan', amount: 3200 },
  { month: 'Feb', amount: 4100 },
  { month: 'Mar', amount: 3800 },
  { month: 'Apr', amount: 5200 },
  { month: 'May', amount: 4800 },
  { month: 'Jun', amount: 6100 },
];

const projectsData = [
  { month: 'Jan', completed: 8, active: 3 },
  { month: 'Feb', completed: 10, active: 4 },
  { month: 'Mar', completed: 12, active: 5 },
  { month: 'Apr', completed: 9, active: 4 },
  { month: 'May', completed: 11, active: 6 },
  { month: 'Jun', completed: 14, active: 5 },
];

const skillsData = [
  { name: 'Video Editing', value: 95, color: '#2979FF' },
  { name: 'Motion Graphics', value: 88, color: '#9333ea' },
  { name: 'Color Grading', value: 92, color: '#ec4899' },
  { name: 'Audio Mixing', value: 78, color: '#f97316' },
];

export function Analytics() {
  const { userRole } = useUser();
  const stats = userRole === 'client' ? statsData.client : statsData.freelancer;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-gray-600">
          {userRole === 'client' 
            ? 'Track your project spending and collaboration metrics' 
            : 'Monitor your growth and optimize your freelance business'}
        </p>
      </motion.div>

      {/* Motivational Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-0 rounded-3xl bg-gradient-to-r from-[#9333ea] via-[#ec4899] to-[#f97316] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">You're on fire! 🔥</h2>
                  <p className="text-sm opacity-90">
                    {userRole === 'client' 
                      ? 'You\'ve launched 3 projects this month. Keep building!' 
                      : 'Your profile views increased by 45% this week. Great work!'}
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 border-white/30 text-white text-sm px-4 py-2">
                Top 10% 🏆
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <Card className="border-gray-200 rounded-2xl hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-700 border-none">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {userRole === 'client' ? 'Total Spent' : 'Total Earned'}
            </p>
            <p className="text-3xl font-bold mb-1">
              ${('totalSpent' in stats ? stats.totalSpent : stats.totalEarned).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-none">
                Active
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Projects</p>
            <p className="text-3xl font-bold mb-1">{stats.activeProjects}</p>
            <p className="text-xs text-gray-500">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 border-none">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold mb-1">{stats.completedProjects}</p>
            <p className="text-xs text-gray-500">All time total</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-yellow-100 text-yellow-700 border-none">
                Excellent
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <p className="text-3xl font-bold mb-1">{stats.avgRating}</p>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {userRole === 'client' ? 'Spending Overview' : 'Earnings Overview'}
                </CardTitle>
                <Badge variant="outline" className="border-gray-200">
                  Last 6 months
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2979FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2979FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2979FF" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Views (Freelancer only) */}
        {userRole === 'freelancer' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Profile Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-[#2979FF] flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold mb-1">{statsData.freelancer.profileViews}</p>
                  <p className="text-sm text-gray-600">Profile Views</p>
                  <Badge className="mt-2 bg-green-100 text-green-700 border-none">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +45% this week
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-semibold">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">On-Time Delivery</span>
                    <span className="font-semibold">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Client Satisfaction</span>
                    <span className="font-semibold">4.9/5.0</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Client Stats */}
        {userRole === 'client' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Collaboration Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-[#9333ea]" />
                    <span className="font-semibold">Freelancers Hired</span>
                  </div>
                  <p className="text-3xl font-bold">18</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-[#2979FF]" />
                    <span className="font-semibold">Success Rate</span>
                  </div>
                  <p className="text-3xl font-bold">94%</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-[#f97316]" />
                    <span className="font-semibold">Avg. Project Cost</span>
                  </div>
                  <p className="text-3xl font-bold">$2.8K</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Project Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="active" fill="#2979FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2979FF]" />
                  <span className="text-sm text-gray-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills Performance (Freelancer) or Budget Breakdown (Client) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">
                {userRole === 'freelancer' ? 'Skills Performance' : 'Budget Allocation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {skillsData.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-sm font-bold" style={{ color: skill.color }}>
                      {skill.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.value}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: skill.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
