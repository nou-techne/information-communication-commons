import { useState } from 'react'
import { Download, ChevronRight, ChevronLeft, FileText, Filter } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import type { HLAMTDimension } from '../types/api'
import type { ExportFormatId } from '../lib/export-formats'
import { EXPORT_FORMATS } from '../lib/export-formats'

type WizardStep = 'scope' | 'format' | 'preview' | 'download'

interface ExportScope {
  convergence?: string
  dateStart?: string
  dateEnd?: string
  dimensions: HLAMTDimension[]
  includeThreads: boolean
  includeContributions: boolean
  includeGraph: boolean
}

export default function ExportPage() {
  const [step, setStep] = useState<WizardStep>('scope')
  const [scope, setScope] = useState<ExportScope>({
    dimensions: [],
    includeThreads: true,
    includeContributions: true,
    includeGraph: false,
  })
  const [format, setFormat] = useState<ExportFormatId>('json')
  const [previewContent, setPreviewContent] = useState('')

  const dimensions: HLAMTDimension[] = ['human', 'language', 'artifact', 'methodology', 'training']

  function toggleDimension(dim: HLAMTDimension) {
    setScope(prev => ({
      ...prev,
      dimensions: prev.dimensions.includes(dim)
        ? prev.dimensions.filter(d => d !== dim)
        : [...prev.dimensions, dim],
    }))
  }

  function generatePreview() {
    // Mock preview generation
    const mockData = {
      convergence: scope.convergence || 'ETHBoulder 2026',
      dateRange: {
        start: scope.dateStart || '2026-02-13',
        end: scope.dateEnd || '2026-02-16',
      },
      dimensions: scope.dimensions,
      includeThreads: scope.includeThreads,
      includeContributions: scope.includeContributions,
      totalItems: 42,
    }

    const formatHandler = EXPORT_FORMATS[format]
    const content = formatHandler.serializer(mockData, { pretty: true })
    if (content instanceof Promise) {
      content.then(setPreviewContent)
    } else {
      setPreviewContent(content)
    }
  }

  function handleNext() {
    if (step === 'scope') {
      setStep('format')
    } else if (step === 'format') {
      generatePreview()
      setStep('preview')
    } else if (step === 'preview') {
      setStep('download')
      handleDownload()
    }
  }

  function handleBack() {
    if (step === 'format') {
      setStep('scope')
    } else if (step === 'preview') {
      setStep('format')
    } else if (step === 'download') {
      setStep('preview')
    }
  }

  function handleDownload() {
    const formatHandler = EXPORT_FORMATS[format]
    const filename = `commons-export-${Date.now()}.${formatHandler.extension}`
    
    const blob = new Blob([previewContent], { type: formatHandler.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function canProceed(): boolean {
    if (step === 'scope') {
      return scope.includeThreads || scope.includeContributions || scope.includeGraph
    }
    return true
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Export Data</h1>
        <p className="text-gray-400">Export your convergence data in multiple formats</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {(['scope', 'format', 'preview', 'download'] as WizardStep[]).map((s, i, arr) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step === s
                  ? 'border-[#a6ed2a] bg-[#a6ed2a] text-black'
                  : arr.indexOf(step) > i
                  ? 'border-[#a6ed2a] text-[#a6ed2a]'
                  : 'border-gray-600 text-gray-600'
              }`}
            >
              {i + 1}
            </div>
            {i < arr.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  arr.indexOf(step) > i ? 'bg-[#a6ed2a]' : 'bg-gray-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Scope */}
      {step === 'scope' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Select Data Scope
          </h2>

          <div className="space-y-6">
            {/* Convergence */}
            <div>
              <label className="block text-sm font-medium mb-2">Convergence</label>
              <Input
                value={scope.convergence || ''}
                onChange={(e) => setScope({ ...scope, convergence: e.target.value })}
                placeholder="ETHBoulder 2026"
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  value={scope.dateStart || ''}
                  onChange={(e) => setScope({ ...scope, dateStart: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="date"
                  value={scope.dateEnd || ''}
                  onChange={(e) => setScope({ ...scope, dateEnd: e.target.value })}
                />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium mb-2">Dimensions</label>
              <div className="flex flex-wrap gap-2">
                {dimensions.map(dim => (
                  <button
                    key={dim}
                    onClick={() => toggleDimension(dim)}
                    className={`px-4 py-2 rounded transition-colors ${
                      scope.dimensions.includes(dim)
                        ? 'bg-[#a6ed2a] text-black'
                        : 'bg-[#0a101d] text-gray-400 hover:bg-[#1d2839]'
                    }`}
                  >
                    {dim}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {scope.dimensions.length === 0 ? 'All dimensions' : `${scope.dimensions.length} selected`}
              </p>
            </div>

            {/* Content types */}
            <div>
              <label className="block text-sm font-medium mb-2">Include</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scope.includeContributions}
                    onChange={(e) => setScope({ ...scope, includeContributions: e.target.checked })}
                  />
                  <span>Contributions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scope.includeThreads}
                    onChange={(e) => setScope({ ...scope, includeThreads: e.target.checked })}
                  />
                  <span>Threads</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scope.includeGraph}
                    onChange={(e) => setScope({ ...scope, includeGraph: e.target.checked })}
                  />
                  <span>Knowledge Graph</span>
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step: Format */}
      {step === 'format' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Choose Export Format
          </h2>

          <div className="grid gap-3">
            {Object.values(EXPORT_FORMATS).map(fmt => (
              <label
                key={fmt.id}
                className={`flex items-start gap-3 p-4 rounded border transition-colors cursor-pointer ${
                  format === fmt.id
                    ? 'border-[#a6ed2a] bg-[#a6ed2a]/10'
                    : 'border-[#1d2839] hover:border-[#3a3a3a]'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={fmt.id}
                  checked={format === fmt.id}
                  onChange={() => setFormat(fmt.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">{fmt.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{fmt.description}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Extension: .{fmt.extension} • MIME: {fmt.mimeType}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Preview</h2>
          <div className="bg-[#060a14] border border-[#1d2839] rounded p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300">{previewContent.slice(0, 1000)}</pre>
            {previewContent.length > 1000 && (
              <p className="text-xs text-gray-500 mt-2">
                ... ({previewContent.length - 1000} more characters)
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Step: Download */}
      {step === 'download' && (
        <Card className="p-6 text-center">
          <Download className="w-16 h-16 mx-auto mb-4 text-[#a6ed2a]" />
          <h2 className="text-xl font-bold mb-2">Export Complete!</h2>
          <p className="text-gray-400 mb-6">Your export has been downloaded</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setStep('scope')}>
              Export Again
            </Button>
            <Button variant="secondary" onClick={handleDownload}>
              Download Again
            </Button>
          </div>
        </Card>
      )}

      {/* Navigation */}
      {step !== 'download' && (
        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 'scope'}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === 'preview' ? 'Download' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
