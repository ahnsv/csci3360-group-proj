'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface UploadDropzoneProps {
  courseId: string | null
}

export function UploadDropzone({ courseId }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // TODO: Implement file upload logic
    console.log('Files dropped:', acceptedFiles)
  }, [courseId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10485760, // 10MB
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed p-8",
        "hover:bg-muted/50 transition-colors cursor-pointer",
        isDragActive ? "border-primary bg-muted/50" : "border-muted-foreground/25"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {isDragActive ? (
          <p className="text-sm text-muted-foreground">Drop the files here ...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              (PDF, DOC, DOCX, TXT files up to 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  )
} 