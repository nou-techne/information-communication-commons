import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, MessageSquare, FileText } from 'lucide-react'
import { Card, CardHeader, CardBody } from './ui/Card'
import { DimensionRadar } from './charts/DimensionRadar'
import { formatDateRange } from '../types/convergence'
import type { Convergence } from '../types/convergence'

interface ConvergenceComparisonProps {
  convergenceA: Convergence
  convergenceB: Convergence
}

export function ConvergenceComparison({ convergenceA, convergenceB }: ConvergenceComparisonProps) {
  // Mock metrics - in real app, fetch from API
  const metricsA = {
    contributions: 127,
    threads: 34,
    artifacts: 89,
    participants: convergenceA.participantCount || 28,
    dimensions: {
      human: 45,
      language: 32,
      artifact: 28,
      methodology: 22,
      training: 15,
    },
  }

  const metricsB = {
    contributions: 98,
    threads: 27,
    artifacts: 64,
    participants: convergenceB.participantCount || 22,
    dimensions: {
      human: 38,
      language: 28,
      artifact: 35,
      methodology: 18,
      training: 12,
    },
  }

  // Calculate participant overlap (mock - would query actual data)
  const participantOverlap = Math.floor(Math.min(metricsA.participants, metricsB.participants) * 0.3)

  return (
    <div className="space-y-6">
      {/* Headers */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <h3 className="text-lg font-bold mb-2">{convergenceA.name}</h3>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDateRange(convergenceA)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {convergenceA.location.city}, {convergenceA.location.country}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-lg font-bold mb-2">{convergenceB.name}</h3>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDateRange(convergenceB)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {convergenceB.location.city}, {convergenceB.location.country}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Metrics Comparison Table */}
      <Card>
        <CardHeader>
          <h3 className="font-bold">Metrics Comparison</h3>
        </CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1d2839]">
                <th className="text-left py-2 text-gray-400 font-medium">Metric</th>
                <th className="text-right py-2 text-gray-400 font-medium">{convergenceA.name}</th>
                <th className="text-right py-2 text-gray-400 font-medium">{convergenceB.name}</th>
                <th className="text-right py-2 text-gray-400 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1d2839]">
                <td className="py-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span>Contributions</span>
                </td>
                <td className="text-right py-3 font-medium">{metricsA.contributions}</td>
                <td className="text-right py-3 font-medium">{metricsB.contributions}</td>
                <td className="text-right py-3 text-green-400">
                  +{metricsA.contributions - metricsB.contributions}
                </td>
              </tr>
              <tr className="border-b border-[#1d2839]">
                <td className="py-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span>Active Threads</span>
                </td>
                <td className="text-right py-3 font-medium">{metricsA.threads}</td>
                <td className="text-right py-3 font-medium">{metricsB.threads}</td>
                <td className="text-right py-3 text-green-400">
                  +{metricsA.threads - metricsB.threads}
                </td>
              </tr>
              <tr className="border-b border-[#1d2839]">
                <td className="py-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>Artifacts</span>
                </td>
                <td className="text-right py-3 font-medium">{metricsA.artifacts}</td>
                <td className="text-right py-3 font-medium">{metricsB.artifacts}</td>
                <td className="text-right py-3 text-green-400">
                  +{metricsA.artifacts - metricsB.artifacts}
                </td>
              </tr>
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Participants</span>
                </td>
                <td className="text-right py-3 font-medium">{metricsA.participants}</td>
                <td className="text-right py-3 font-medium">{metricsB.participants}</td>
                <td className="text-right py-3 text-green-400">
                  +{metricsA.participants - metricsB.participants}
                </td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Dimension Radar Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Dimension Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <DimensionRadar
                  data={metricsB.dimensions}
                  size={280}
                  color="#6366f1"
                  showLabels={true}
                  showGrid={true}
                />
              </div>
              <div className="relative flex items-center justify-center">
                <DimensionRadar
                  data={metricsA.dimensions}
                  size={280}
                  color="#a6ed2a"
                  showLabels={true}
                  showGrid={false}
                />
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#a6ed2a]" />
                <span className="text-gray-400">{convergenceA.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
                <span className="text-gray-400">{convergenceB.name}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Participant Overlap Venn (Simplified) */}
        <Card>
          <CardHeader>
            <h3 className="font-bold">Participant Overlap</h3>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-center h-64">
              <svg width="300" height="200" className="participant-venn">
                {/* Left circle (A) */}
                <circle cx="100" cy="100" r="60" fill="#a6ed2a" fillOpacity="0.3" stroke="#a6ed2a" strokeWidth="2" />
                {/* Right circle (B) */}
                <circle cx="200" cy="100" r="60" fill="#6366f1" fillOpacity="0.3" stroke="#6366f1" strokeWidth="2" />
                
                {/* Labels */}
                <text x="70" y="105" textAnchor="middle" className="text-sm fill-white font-bold">
                  {metricsA.participants - participantOverlap}
                </text>
                <text x="150" y="105" textAnchor="middle" className="text-sm fill-white font-bold">
                  {participantOverlap}
                </text>
                <text x="230" y="105" textAnchor="middle" className="text-sm fill-white font-bold">
                  {metricsB.participants - participantOverlap}
                </text>
                
                {/* Legend */}
                <text x="100" y="175" textAnchor="middle" className="text-xs fill-gray-400">
                  {convergenceA.name}
                </text>
                <text x="200" y="175" textAnchor="middle" className="text-xs fill-gray-400">
                  {convergenceB.name}
                </text>
              </svg>
            </div>
            <div className="text-center text-sm text-gray-400">
              <div className="mb-1">
                <span className="font-medium text-white">{participantOverlap}</span> shared participants
              </div>
              <div className="text-xs text-gray-500">
                {((participantOverlap / Math.max(metricsA.participants, metricsB.participants)) * 100).toFixed(0)}%
                overlap rate
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
