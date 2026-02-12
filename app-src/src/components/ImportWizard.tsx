import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle, FileJson, FileSpreadsheet, X } from 'lucide-react'
import { Button } from './Button'
import { Card } from './ui/Card'
import { parseCSV } from '../lib/exporters/csv'

type ImportStep = 'upload' | 'preview' | 'mapping' | 'confirm' | 'complete'
type ImportFormat = 'json' | 'csv' | 'unknown'
type ConflictResolution = 'skip' | 'overwrite' | 'merge'

interface ImportWizardProps {
  onImport: (data: any[], options: ImportOptions) => void
  onClose: () => void
}

interface ImportOptions {
  conflictResolution: ConflictResolution
  fieldMapping?: Record<string, string>
}

export function ImportWizard({ onImport, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImportFormat>('unknown')
  const [parsedData, setParsedData] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('skip')
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})

  function detectFormat(filename: string): ImportFormat {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'json') return 'json'
    if (ext === 'csv') return 'csv'
    return 'unknown'
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)

    const detectedFormat = detectFormat(selectedFile.name)
    setFormat(detectedFormat)

    try {
      const content = await selectedFile.text()
      let data: any[]

      if (detectedFormat === 'json') {
        data = JSON.parse(content)
        if (!Array.isArray(data)) {
          data = [data]
        }
      } else if (detectedFormat === 'csv') {
        data = parseCSV(content)
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.')
      }

      setParsedData(data)
      setPreviewData(data.slice(0, 5))

      // Auto-generate field mapping
      if (data.length > 0) {
        const mapping: Record<string, string> = {}
        Object.keys(data[0]).forEach(key => {
          mapping[key] = key // Default: identity mapping
        })
        setFieldMapping(mapping)
      }

      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  function handleImport() {
    onImport(parsedData, {
      conflictResolution,
      fieldMapping,
    })
    setStep('complete')
  }

  function reset() {
    setStep('upload')
    setFile(null)
    setFormat('unknown')
    setParsedData([])
    setPreviewData([])
    setError(null)
    setFieldMapping({})
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1d2839]">
          <h2 className="text-2xl font-bold">Import Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#0a101d] rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-[#1d2839] rounded-lg p-12 text-center hover:border-[#3a3a3a] transition-colors">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-bold mb-2">Upload File</h3>
                <p className="text-gray-400 mb-4">
                  Supports JSON and CSV formats
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button as="span">
                    Choose File
                  </Button>
                </label>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900 rounded flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-500">Import Error</div>
                    <div className="text-sm text-red-400 mt-1">{error}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {format === 'json' && <FileJson className="w-6 h-6 text-blue-500" />}
                {format === 'csv' && <FileSpreadsheet className="w-6 h-6 text-green-500" />}
                <div>
                  <div className="font-medium">{file?.name}</div>
                  <div className="text-sm text-gray-500">
                    {parsedData.length} record{parsedData.length !== 1 ? 's' : ''} found
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold mb-2">Preview (first 5 records)</h3>
                <div className="bg-[#060a14] border border-[#1d2839] rounded overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1d2839]">
                        {previewData.length > 0 &&
                          Object.keys(previewData[0]).map(key => (
                            <th key={key} className="text-left p-3 text-gray-400 font-medium">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-b border-[#1d2839] last:border-0">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="p-3 text-gray-300">
                              {String(value).slice(0, 50)}
                              {String(value).length > 50 ? '...' : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep('mapping')}>
                  Next: Field Mapping
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div>
              <h3 className="font-bold mb-4">Field Mapping</h3>
              <p className="text-sm text-gray-400 mb-4">
                Map imported fields to system fields (or leave as-is)
              </p>

              <div className="space-y-3 mb-6">
                {Object.keys(fieldMapping).map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1 font-mono text-sm bg-[#0a101d] p-2 rounded">
                      {key}
                    </div>
                    <span className="text-gray-500">→</span>
                    <input
                      type="text"
                      value={fieldMapping[key]}
                      onChange={(e) =>
                        setFieldMapping({ ...fieldMapping, [key]: e.target.value })
                      }
                      className="flex-1 bg-[#060a14] border border-[#1d2839] rounded px-3 py-2 text-sm"
                      placeholder="Target field"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep('confirm')}>
                  Next: Confirm
                </Button>
                <Button variant="secondary" onClick={() => setStep('preview')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div>
              <h3 className="font-bold mb-4">Conflict Resolution</h3>
              <p className="text-sm text-gray-400 mb-4">
                How should conflicts with existing data be handled?
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 p-4 border border-[#1d2839] rounded cursor-pointer hover:border-[#3a3a3a]">
                  <input
                    type="radio"
                    name="conflict"
                    value="skip"
                    checked={conflictResolution === 'skip'}
                    onChange={() => setConflictResolution('skip')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Skip Duplicates</div>
                    <div className="text-sm text-gray-500">
                      Keep existing data, ignore imports with same ID
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-[#1d2839] rounded cursor-pointer hover:border-[#3a3a3a]">
                  <input
                    type="radio"
                    name="conflict"
                    value="overwrite"
                    checked={conflictResolution === 'overwrite'}
                    onChange={() => setConflictResolution('overwrite')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Overwrite</div>
                    <div className="text-sm text-gray-500">
                      Replace existing data with imported data
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-[#1d2839] rounded cursor-pointer hover:border-[#3a3a3a]">
                  <input
                    type="radio"
                    name="conflict"
                    value="merge"
                    checked={conflictResolution === 'merge'}
                    onChange={() => setConflictResolution('merge')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Merge</div>
                    <div className="text-sm text-gray-500">
                      Combine existing and imported data (when possible)
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImport}>
                  Import {parsedData.length} Record{parsedData.length !== 1 ? 's' : ''}
                </Button>
                <Button variant="secondary" onClick={() => setStep('mapping')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-bold mb-2">Import Complete!</h3>
              <p className="text-gray-400 mb-6">
                Successfully imported {parsedData.length} record{parsedData.length !== 1 ? 's' : ''}
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={onClose}>
                  Close
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Import More
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
