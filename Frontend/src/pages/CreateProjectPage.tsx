import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button, Input, Textarea } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/api'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  estimatedRows: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  progress: number
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
  const bytesPerRow = 150 // rough estimate
  return Math.round(file.size / bytesPerRow)
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: details, 2: upload, 3: review
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

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

      const newFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: getFileType(file),
        estimatedRows: estimateRows(file),
        status: 'pending',
        progress: 0,
      }

      setFiles(prev => [...prev, newFile])
      simulateUpload(newFile.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading' } : f))

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'complete', progress: 100 } : f
        ))
      } else {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f))
      }
    }, 300)

    return () => clearInterval(interval)
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
        dataset_name: firstFile.name,
        dataset_size: firstFile.size,
        dataset_rows: firstFile.estimatedRows,
        dataset_columns: firstFile.type === 'CSV' ? 10 : firstFile.type === 'Excel' ? 15 : 8,
      })
      navigate(`/projects/${project.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      alert(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const canProceed = currentStep === 1 ? projectName.trim() : files.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Project Details' },
          { num: 2, label: 'Upload Dataset' },
          { num: 3, label: 'Review & Create' },
        ].map((step, index) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center relative"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                currentStep > step.num
                  ? 'bg-accent text-bg-0'
                  : currentStep === step.num
                  ? 'bg-accent text-bg-0 ring-4 ring-accent/20'
                  : 'bg-bg-2 text-fg-3'
              )}
            >
              {currentStep > step.num ? <CheckCircle className="w-5 h-5" /> : step.num}
            </div>
            <span className={cn('mt-2 text-sm font-medium text-center w-32', currentStep >= step.num ? 'text-fg-0' : 'text-fg-3')}>
              {step.label}
            </span>
            {index < 2 && (
              <div
                className={cn(
                  'absolute top-5 left-1/2 w-full h-1 -ml-1/2 -translate-y-1/2',
                  currentStep > index + 1 ? 'bg-accent' : 'bg-border-1'
                )}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Step 1: Project Details */}
      {currentStep === 1 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Give your project a name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              placeholder="Describe what this project is about..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="lg" onClick={handleNext} disabled={!projectName.trim()}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Upload Dataset */}
      {currentStep === 2 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
            <CardDescription>Drag and drop your data file or click to browse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-all duration-200',
                dragActive ? 'border-accent bg-accent-bg/30' : 'border-border-1 hover:border-accent/50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className={cn('mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center', dragActive ? 'bg-accent/20' : 'bg-bg-2')}>
                  <Upload className={cn('w-8 h-8', dragActive ? 'text-accent' : 'text-fg-3')} />
                </div>
                <p className="text-lg font-medium text-fg-0 mb-1">Drop your dataset here</p>
                <p className="text-fg-2 mb-4">or click to browse</p>
                <div className="flex items-center justify-center gap-4 text-sm text-fg-3">
                  <Badge variant="accent" size="sm">CSV</Badge>
                  <Badge variant="accent" size="sm">Excel</Badge>
                  <Badge variant="accent" size="sm">JSON</Badge>
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-fg-1">Selected Files</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map(file => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-3 bg-bg-2 rounded-lg"
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        file.type === 'CSV' ? 'bg-data-1-bg text-data-1' :
                        file.type === 'Excel' ? 'bg-data-2-bg text-data-2' :
                        'bg-data-4-bg text-data-4'
                      )}>
                        {file.type === 'CSV' && <FileSpreadsheet className="w-5 h-5" />}
                        {file.type === 'Excel' && <FileSpreadsheet className="w-5 h-5" />}
                        {file.type === 'JSON' && <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-fg-0 truncate">{file.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-fg-2">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{file.estimatedRows.toLocaleString()} est. rows</span>
                          <Badge variant="accent" size="sm">{file.type}</Badge>
                        </div>
                        {file.status === 'uploading' && (
                          <div className="w-32 h-2 bg-bg-3 rounded-full mt-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              className="h-full bg-accent rounded-full"
                            />
                          </div>
                        )}
                        {file.status === 'complete' && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-error" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error hover:bg-error/10"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="lg" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button size="lg" onClick={handleNext} disabled={files.length === 0}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Review & Create */}
      {currentStep === 3 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
            <CardDescription>Confirm your project details before creating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-fg-1 mb-3">Project Information</h4>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-fg-2">Name</dt>
                    <dd className="font-medium text-fg-0">{projectName || 'Untitled Project'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-2">Description</dt>
                    <dd className="font-medium text-fg-0">{description || 'No description'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-medium text-fg-1 mb-3">Dataset ({files.length} file{files.length !== 1 ? 's' : ''})</h4>
                <dl className="space-y-3 text-sm">
                  {files.map(file => (
                    <div key={file.id} className="p-3 bg-bg-2 rounded-lg">
                      <div className="flex items-center justify-between">
                        <dt className="font-medium text-fg-0 truncate pr-2">{file.name}</dt>
                        <Badge variant="accent" size="sm">{file.type}</Badge>
                      </div>
                      <dd className="text-fg-2 text-xs mt-1">
                        {formatBytes(file.size)} • ~{file.estimatedRows.toLocaleString()} rows • {file.status}
                      </dd>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-border-1">
                    <dt className="font-medium text-fg-1">Total Size</dt>
                    <dd className="font-medium text-fg-0">
                      {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-fg-1">Total Rows (est.)</dt>
                    <dd className="font-medium text-fg-0">
                      {files.reduce((sum, f) => sum + f.estimatedRows, 0).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <Separator />
            <div className="flex items-center gap-3 p-4 bg-accent-bg/30 border border-accent/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <p className="font-medium text-accent">Ready to create</p>
                <p className="text-sm text-accent/80">Your project will be created with the uploaded datasets</p>
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
      )}
    </div>
  )
}