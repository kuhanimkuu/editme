import { ArrowUpRight, ArrowDownLeft, Shield, Lock, Plus, Download, TrendingUp, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { mockTransactions } from '../data/mockData';
import { useUser } from '../context/UserContext';
import { motion } from 'motion/react';

export function Wallet() {
  const { userRole } = useUser();

  const totalBalance = 15000;
  const availableFunds = 8300;
  const fundsInEscrow = 6700;

  const statusColors = {
    'completed': 'bg-[#10b981] text-white',
    'in-escrow': 'bg-[#9333ea] text-white',
    'pending': 'bg-[#f59e0b] text-white',
    'failed': 'bg-red-500 text-white',
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Wallet & Payments</h1>
        <p className="text-gray-600">
          Secure escrow system for safe and transparent transactions
        </p>
      </motion.div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-0 rounded-3xl bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24" />
          
          <CardContent className="p-8 relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">Secured by EditMe</span>
                </div>
                <p className="text-5xl font-bold mb-1">${totalBalance.toLocaleString()}</p>
                <p className="text-sm opacity-80">Total Balance</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Funds
                </Button>
                <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/30 text-white rounded-xl">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">Available</span>
                  <ArrowUpRight className="w-4 h-4 opacity-60" />
                </div>
                <p className="text-2xl font-bold">${availableFunds.toLocaleString()}</p>
                <p className="text-xs opacity-70 mt-1">Ready to withdraw</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">In Escrow</span>
                  <Lock className="w-4 h-4 opacity-60" />
                </div>
                <p className="text-2xl font-bold">${fundsInEscrow.toLocaleString()}</p>
                <p className="text-xs opacity-70 mt-1">Secured transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2979FF] flex items-center justify-center mx-auto mb-3 transition-colors">
              <Plus className="w-6 h-6 text-[#2979FF] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-sm">Add Money</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 group-hover:bg-[#10b981] flex items-center justify-center mx-auto mb-3 transition-colors">
              <ArrowDownLeft className="w-6 h-6 text-[#10b981] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-sm">Withdraw</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-50 group-hover:bg-[#9333ea] flex items-center justify-center mx-auto mb-3 transition-colors">
              <Shield className="w-6 h-6 text-[#9333ea] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-sm">Escrow</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-[#f97316] flex items-center justify-center mx-auto mb-3 transition-colors">
              <Download className="w-6 h-6 text-[#f97316] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-sm">History</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Transaction History</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#2979FF]">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.amount > 0 
                          ? 'bg-green-50' 
                          : transaction.status === 'in-escrow'
                          ? 'bg-purple-50'
                          : 'bg-gray-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <ArrowDownLeft className={`w-5 h-5 ${
                            transaction.status === 'in-escrow' ? 'text-[#9333ea]' : 'text-[#10b981]'
                          }`} />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{transaction.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          transaction.amount > 0 ? 'text-[#10b981]' : 'text-gray-900'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount > 0 ? transaction.amount : transaction.amount}
                          <span className="text-sm ml-1">USD</span>
                        </p>
                        <Badge className={`${statusColors[transaction.status]} border-none text-xs mt-1`}>
                          {transaction.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {index < mockTransactions.length - 1 && <Separator />}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security & Info Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Escrow Info */}
          <Card className="border-gray-200 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#9333ea] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Escrow Protection</h3>
                  <p className="text-xs text-gray-600">100% Secure</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Your funds are held securely until work is approved. Both parties are protected throughout the transaction.
              </p>
              <Button variant="outline" size="sm" className="w-full rounded-lg border-[#9333ea] text-[#9333ea] hover:bg-[#9333ea] hover:text-white">
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Earned</p>
                    <p className="font-bold">$8,450</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-none">
                  +12%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-[#2979FF]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Spent</p>
                    <p className="font-bold">$12,300</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-none">
                  -5%
                </Badge>
              </div>

              <Separator />

              <div className="text-center p-3">
                <p className="text-2xl font-bold text-[#2979FF] mb-1">
                  {userRole === 'client' ? '4' : '23'}
                </p>
                <p className="text-sm text-gray-600">Transactions</p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Badge */}
          <Card className="border-gray-200 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#2979FF] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Bank-Level Security</h3>
              <p className="text-sm text-gray-600">
                Your financial data is encrypted and protected with industry-leading security protocols.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
