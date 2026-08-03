import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button, Input, Textarea } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import {
  Upload, FileSpreadsheet, FileText, X, CheckCircle, Loader2,
  ArrowLeft, Plus, ArrowRight, Lightbulb,
} from 'lucide-react'
import { api } from '@/lib/api'

let fileIdCounter = 0
function nextFileId(): string {
  fileIdCounter++
  return `file-${Date.now()}-${fileIdCounter}`
}

interface UploadedFileEntry {
  id: string
  name: string
  size: number
  type: string
  estimatedRows: number
  file: File
}

const supportedTypes = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
]

const getFileType = (file: File) => {
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) return 'CSV'
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return 'Excel'
  if (file.type === 'application/json' || file.name.endsWith('.json')) return 'JSON'
  return 'Unknown'
}

const estimateRows = (file: File) => {
  const bytesPerRow = 150
  return Math.round(file.size / bytesPerRow)
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<UploadedFileEntry[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      if (!supportedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|json)$/i)) {
        alert(`${file.name} is not a supported file type. Please upload CSV, Excel, or JSON files.`)
        return
      }
      const entry: UploadedFileEntry = {
        id: nextFileId(),
        name: file.name,
        size: file.size,
        type: getFileType(file),
        estimatedRows: estimateRows(file),
        file,
      }
      setFiles(prev => [...prev, entry])
    })
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleNext = () => {
    if (currentStep === 1 && !projectName.trim()) return
    setCurrentStep(s => Math.min(s + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 1))
  }

  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (files.length === 0) return
    setCreating(true)
    try {
      const firstFile = files[0]
      const project = await api.projects.create({
        name: projectName,
        description: description,
      })
      if (firstFile) {
        await api.datasets.upload(firstFile.file, project.id)
      }
      navigate(`/projects/${project.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      alert(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Create New Project</h1>
          <p className="text-sm text-fg-2 mt-1">Upload a dataset and let AI analyze it for insights</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Upload' },
            { num: 3, label: 'Review' },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2"
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                    currentStep > step.num
                      ? 'bg-accent text-bg-0'
                      : currentStep === step.num
                      ? 'bg-accent text-bg-0 ring-4 ring-accent/20'
                      : 'bg-bg-2 text-fg-3'
                  )}
                >
                  {currentStep > step.num ? <CheckCircle className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className={cn('text-sm font-medium', currentStep >= step.num ? 'text-fg-0' : 'text-fg-3')}>
                  {step.label}
                </span>
              </motion.div>
              {index < 2 && (
                <div className={cn(
                  'w-12 h-0.5 mx-2 rounded-full',
                  currentStep > index + 1 ? 'bg-accent' : 'bg-border-1'
                )} />
              )}
            </div>
          ))}
        </div>
      </section>

      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Give your project a name and optional description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="Project Name"
                placeholder="e.g., Sales Analysis Q1 2026"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                autoFocus
                required
              />
              <Textarea
                label="Description (optional)"
                placeholder="What are you analyzing? What questions do you want to answer?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button size="lg" onClick={handleNext} disabled={!projectName.trim()}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {currentStep === 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card variant="elevated" className="overflow-hidden">
            <div
              className={cn(
                'relative border-2 border-dashed transition-all duration-200',
                dragActive ? 'border-accent bg-accent-bg/20' : 'border-border-1 hover:border-accent/40'
              )}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false) }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFiles(e.dataTransfer.files) }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block p-12 text-center">
                <div className={cn(
                  'mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                  dragActive ? 'bg-accent/20' : 'bg-bg-2'
                )}>
                  <Upload className={cn('w-8 h-8', dragActive ? 'text-accent' : 'text-fg-3')} />
                </div>
                <p className="text-lg font-medium text-fg-0 mb-1">
                  {dragActive ? 'Drop your file here' : 'Drop your dataset here'}
                </p>
                <p className="text-sm text-fg-2 mb-5">or click to browse files</p>
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="accent" size="sm">CSV</Badge>
                  <Badge variant="accent" size="sm">Excel</Badge>
                  <Badge variant="accent" size="sm">JSON</Badge>
                </div>
                <p className="text-xs text-fg-3 mt-4">Maximum file size: 50MB</p>
              </label>
            </div>
          </Card>

          {files.length > 0 && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Selected Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map(file => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-3 bg-bg-2 rounded-lg"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      file.type === 'CSV' ? 'bg-data-1-bg text-data-1' :
                      file.type === 'Excel' ? 'bg-data-2-bg text-data-2' :
                      'bg-data-4-bg text-data-4'
                    )}>
                      {file.type === 'CSV' && <FileSpreadsheet className="w-4 h-4" />}
                      {file.type === 'Excel' && <FileSpreadsheet className="w-4 h-4" />}
                      {file.type === 'JSON' && <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg-0 truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-fg-3">
                        <span>{formatBytes(file.size)}</span>
                        <span>·</span>
                        <span>~{file.estimatedRows.toLocaleString()} rows</span>
                        <Badge variant="accent" size="sm">{file.type}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error hover:text-error hover:bg-error/10 h-8 w-8 p-0"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card variant="outlined" className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-data-3 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-fg-2">
                <p className="font-medium text-fg-1 mb-1">Tips for best results</p>
                <ul className="space-y-0.5 list-disc list-inside text-fg-3">
                  <li>CSV files should have headers in the first row</li>
                  <li>Excel files: data should be in the first sheet</li>
                  <li>For best analysis, datasets should have at least 10 rows</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="lg" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button size="lg" onClick={handleNext} disabled={files.length === 0}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {currentStep === 3 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>Confirm your project details before creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3">Project Information</h4>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-fg-2">Name</dt>
                      <dd className="font-medium text-fg-0">{projectName || 'Untitled Project'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-fg-2">Description</dt>
                      <dd className="font-medium text-fg-0 truncate max-w-[200px]">{description || 'No description'}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3">Dataset ({files.length} file{files.length !== 1 ? 's' : ''})</h4>
                  <dl className="space-y-2.5 text-sm">
                    {files.map(file => (
                      <div key={file.id} className="p-3 bg-bg-2 rounded-lg">
                        <div className="flex items-center justify-between">
                          <dt className="font-medium text-fg-0 truncate pr-2">{file.name}</dt>
                          <Badge variant="accent" size="sm">{file.type}</Badge>
                        </div>
                        <dd className="text-fg-3 text-xs mt-1">
                          {formatBytes(file.size)} · ~{file.estimatedRows.toLocaleString()} rows
                        </dd>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-border-1">
                      <dt className="font-medium text-fg-1">Total Size</dt>
                      <dd className="font-medium text-fg-0">
                        {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 p-4 bg-accent-bg/20 border border-accent/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-accent">Ready to create</p>
                  <p className="text-xs text-accent/70">Your project will be created and the dataset will be analyzed automatically</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="lg" onClick={handleBack} disabled={creating}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button size="lg" onClick={handleCreate} disabled={creating || files.length === 0} className="group">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                    Create Project
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
