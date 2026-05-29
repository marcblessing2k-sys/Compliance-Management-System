import { useState } from 'react';
import { Mail } from 'lucide-react';
import { ComplianceRecord } from '../types/compliance';
import {
  calculateComplianceRate,
  calculateNonComplianceRate,
  getComplianceByCategory,
  getComplianceByBusinessProcess,
  getStatusCounts,
  getHighPriorityIssues,
  getRatingLabel
} from '../utils/complianceCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { EmailReportModal } from './EmailReportModal';

interface DashboardProps {
  record: ComplianceRecord | null;
  allRecords?: ComplianceRecord[];
}

export function Dashboard({ record, allRecords }: DashboardProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Overview Dashboard for All Employees
  if (allRecords && !record) {
    const totalEmployees = allRecords.length;
    const employeeStats = allRecords.map(r => ({
      employee: r.employee,
      complianceRate: calculateComplianceRate(r.checklist),
      highPriorityIssues: getHighPriorityIssues(r.checklist)
    }));

    const avgCompliance = Math.round(
      employeeStats.reduce((sum, e) => sum + e.complianceRate, 0) / totalEmployees
    );

    const highPerformers = employeeStats.filter(e => e.complianceRate >= 90);
    const needsAttention = employeeStats.filter(e => e.complianceRate < 60);

    // Employee Performance Ranking
    const performanceRanking = employeeStats
      .sort((a, b) => b.complianceRate - a.complianceRate)
      .map((e, idx) => ({
        id: `perf-${idx}`,
        name: e.employee.name,
        rate: e.complianceRate
      }));

    // Department Performance
    const deptMap = new Map<string, { total: number; sum: number; count: number }>();
    allRecords.forEach(r => {
      const dept = r.employee.department;
      const compliance = calculateComplianceRate(r.checklist);
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, sum: 0, count: 0 });
      }
      const data = deptMap.get(dept)!;
      data.sum += compliance;
      data.count++;
    });

    const departmentData = Array.from(deptMap.entries()).map(([dept, data], idx) => ({
      id: `dept-${idx}`,
      name: dept,
      rate: Math.round(data.sum / data.count)
    }));

    // All high priority issues across organization
    const allHighPriorityIssues = allRecords.flatMap(r => {
      const issues = getHighPriorityIssues(r.checklist);
      return issues.map(issue => ({
        ...issue,
        employeeName: r.employee.name,
        employeeId: r.employee.id
      }));
    });

    return (
      <div className="space-y-6">
        {/* Overview Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold">Organization Overview</h2>
          <p className="text-gray-600 mt-1">Performance metrics across all employees</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#5B9BD5] to-[#4682B4] rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Total Employees</h3>
            <p className="text-5xl font-bold">{totalEmployees}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Avg Compliance</h3>
            <p className="text-5xl font-bold">{avgCompliance}%</p>
          </div>

          <div className="bg-gradient-to-br from-[#FFE54D] to-[#FFD700] rounded-lg shadow p-6 text-gray-900">
            <h3 className="text-lg font-semibold mb-2">High Performers</h3>
            <p className="text-5xl font-bold">{highPerformers.length}</p>
            <p className="text-sm">90%+ compliance</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Needs Attention</h3>
            <p className="text-5xl font-bold">{needsAttention.length}</p>
            <p className="text-sm">&lt;60% compliance</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Employee Performance Ranking</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceRanking} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#5B9BD5" name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Department Performance</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#FFD700" name="Avg Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Priority Issues */}
        {allHighPriorityIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-800 mb-4">
              Organization-Wide High Priority Issues ({allHighPriorityIssues.length})
            </h3>
            <div className="space-y-2">
              {allHighPriorityIssues.slice(0, 10).map((issue, idx) => (
                <div key={`issue-${idx}`} className="bg-white rounded p-3 border border-red-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">{issue.requirement}</p>
                      <div className="flex gap-4 mt-2 text-sm flex-wrap">
                        <span className="text-gray-600">Employee: {issue.employeeName}</span>
                        <span className="text-gray-600">Process: {issue.businessProcess}</span>
                        <span className="text-gray-600">Category: {issue.category}</span>
                        <span className="text-red-600 font-semibold">Status: {issue.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {allHighPriorityIssues.length > 10 && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  Showing 10 of {allHighPriorityIssues.length} high priority issues
                </p>
              )}
            </div>
          </div>
        )}

        {/* Performance Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4 text-green-800">Top Performers (90%+)</h3>
            {highPerformers.length === 0 ? (
              <p className="text-gray-600">No employees currently at 90%+ compliance</p>
            ) : (
              <div className="space-y-3">
                {highPerformers.map((emp, idx) => (
                  <div key={`high-${idx}`} className="border border-green-200 bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{emp.employee.name}</p>
                        <p className="text-sm text-gray-600">{emp.employee.role} - {emp.employee.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{emp.complianceRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employees Needing Support */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4 text-red-800">Employees Needing Support (&lt;60%)</h3>
            {needsAttention.length === 0 ? (
              <p className="text-gray-600">All employees are above 60% compliance</p>
            ) : (
              <div className="space-y-3">
                {needsAttention.map((emp, idx) => (
                  <div key={`low-${idx}`} className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{emp.employee.name}</p>
                        <p className="text-sm text-gray-600">{emp.employee.role} - {emp.employee.department}</p>
                        <p className="text-xs text-red-700 mt-1">
                          {emp.highPriorityIssues.length} high priority issues
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{emp.complianceRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single Employee Dashboard
  if (!record) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600">No employee selected</p>
      </div>
    );
  }

  const complianceRate = calculateComplianceRate(record.checklist);
  const nonComplianceRate = calculateNonComplianceRate(record.checklist);
  const categoryBreakdown = getComplianceByCategory(record.checklist);
  const businessProcessBreakdown = getComplianceByBusinessProcess(record.checklist);
  const statusCounts = getStatusCounts(record.checklist);
  const highPriorityIssues = getHighPriorityIssues(record.checklist);
  const rating = getRatingLabel(complianceRate);

  // Create a unique identifier for this dashboard instance
  const dashboardId = `${record.employee.id}-${record.lastUpdated}`;

  const categoryData = Object.entries(categoryBreakdown).map(([name, data], index) => ({
    id: `category-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    rate: data.rate,
    compliant: data.compliant,
    total: data.total
  }));

  const statusData = [
    { id: 'compliant', name: 'Compliant', value: statusCounts.Compliant, color: '#22c55e' },
    { id: 'in-progress', name: 'In Progress', value: statusCounts['In Progress'], color: '#3b82f6' },
    { id: 'not-started', name: 'Not Started', value: statusCounts['Not Started'], color: '#94a3b8' },
    { id: 'non-compliant', name: 'Non-Compliant', value: statusCounts['Non-Compliant'], color: '#ef4444' },
    { id: 'na', name: 'N/A', value: statusCounts['N/A'], color: '#d1d5db' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Employee Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Employee Details</h2>
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Mail size={20} />
            Send Report by Email
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-semibold">{record.employee.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <p className="font-semibold">{record.employee.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Department</p>
            <p className="font-semibold">{record.employee.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Review Period</p>
            <p className="font-semibold">{record.employee.reviewPeriod}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reviewer</p>
            <p className="font-semibold">{record.employee.reviewer}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="font-semibold">{new Date(record.employee.date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#5B9BD5] to-[#4682B4] rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Overall Compliance</h3>
          <p className="text-5xl font-bold mb-2">{complianceRate}%</p>
          <p className={`text-xl ${rating.color === 'text-green-600' ? 'text-green-100' : rating.color === 'text-[#5B9BD5]' ? 'text-blue-100' : rating.color === 'text-yellow-600' ? 'text-yellow-100' : 'text-red-100'}`}>
            {rating.label}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Non-Compliance Rate</h3>
          <p className="text-5xl font-bold mb-2">{nonComplianceRate}%</p>
          <p className="text-sm">
            {nonComplianceRate === 0 ? 'Fully Compliant' : `${statusCounts['Non-Compliant'] + statusCounts['Not Started']} items need attention`}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FFE54D] to-[#FFD700] rounded-lg shadow p-6 text-gray-900">
          <h3 className="text-lg font-semibold mb-2">High Priority Issues</h3>
          <p className="text-5xl font-bold mb-2">{highPriorityIssues.length}</p>
          <p className="text-sm">
            {highPriorityIssues.length === 0 ? 'No urgent items' : 'Require immediate attention'}
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Compliance by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} key={`category-chart-${dashboardId}`}>
              <CartesianGrid strokeDasharray="3 3" key={`grid-cat-${dashboardId}`} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} key={`xaxis-cat-${dashboardId}`} />
              <YAxis domain={[0, 100]} key={`yaxis-cat-${dashboardId}`} />
              <Tooltip key={`tooltip-cat-${dashboardId}`} />
              <Legend key={`legend-cat-${dashboardId}`} />
              <Bar dataKey="rate" fill="#3b82f6" name="Compliance Rate %" key={`bar-cat-${dashboardId}`} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart key={`status-chart-${dashboardId}`}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                key={`pie-status-${dashboardId}`}
              >
                {statusData.map((entry) => (
                  <Cell key={`cell-${entry.id}-${dashboardId}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key={`tooltip-status-${dashboardId}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High Priority Issues */}
      {highPriorityIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-800 mb-4">High Priority Issues Requiring Immediate Attention</h3>
          <div className="space-y-2">
            {highPriorityIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded p-3 border border-red-300">
                <p className="font-semibold text-red-900">{issue.requirement}</p>
                <div className="flex gap-4 mt-2 text-sm flex-wrap">
                  <span className="text-gray-600">Process: {issue.businessProcess}</span>
                  <span className="text-gray-600">Category: {issue.category}</span>
                  <span className="text-red-600 font-semibold">Status: {issue.status}</span>
                  {issue.targetDate && <span className="text-gray-600">Target: {issue.targetDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Process Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Business Process Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(businessProcessBreakdown).map(([process, data]) => (
            <div key={process} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-sm">{process}</h4>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{data.rate}%</span>
                <span className="text-sm text-gray-600">
                  {data.compliant}/{data.total} items
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${data.rate >= 90 ? 'bg-green-500' : data.rate >= 75 ? 'bg-[#5B9BD5]' : data.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${data.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categoryBreakdown).map(([category, data]) => (
            <div key={category} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">{category}</h4>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{data.rate}%</span>
                <span className="text-sm text-gray-600">
                  {data.compliant}/{data.total} items
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5B9BD5] transition-all"
                  style={{ width: `${data.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        record={record}
      />
    </div>
  );
}
