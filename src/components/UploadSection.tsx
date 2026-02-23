"use client"

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, File, X, Trash2, Plus, Presentation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UploadSectionProps {
  onDataChange: (text: string, files: FileData[]) => void;
}

export function UploadSection({ onDataChange }: UploadSectionProps) {
  const [textInput, setTextInput] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pptxInputRef = useRef<HTMLInputElement>(null);
  const generalInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextInput(val);
    onDataChange(val, files);
  };

  const processFiles = async (uploadedFiles: File[]) => {
    const newFiles: FileData[] = [];

    for (const file of uploadedFiles) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isPptx = file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

      if (!isImage && !isPdf && !isPptx) {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: `${file.name} is not an image, PDF, or PPTX.`
        });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit.`
        });
        continue;
      }

      const reader = new FileReader();
      const fileData: FileData = await new Promise((resolve) => {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUri: isImage ? result : undefined,
            textContent: (isPdf || isPptx) ? `[Content of ${isPdf ? 'PDF' : 'PPTX'}: ${file.name}]` : undefined
          });
        };
        
        if (isImage) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      });
      newFiles.push(fileData);
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onDataChange(textInput, updatedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    processFiles(uploadedFiles);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onDataChange(textInput, updatedFiles);
  };

  return (
    <Card className="w-full shadow-md border-border bg-card">
      <CardContent className="p-6">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText size={16} /> Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageIcon size={16} /> Image
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <File size={16} /> PDF
            </TabsTrigger>
            <TabsTrigger value="pptx" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Presentation size={16} /> PPTX
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-0">
            <div className="space-y-2 relative">
              <div className="relative group">
                <Textarea
                  placeholder="Paste your study notes, questions, or textbook excerpts here..."
                  className="min-h-[200px] text-base resize-none focus-visible:ring-accent pl-4 pb-14"
                  value={textInput}
                  onChange={handleTextChange}
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={generalInputRef} 
                    multiple
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" 
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 rounded-full shadow-md bg-white hover:bg-accent hover:text-white transition-all border border-border"
                    onClick={() => generalInputRef.current?.click()}
                    title="Add Image or Document"
                  >
                    <Plus size={20} />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <span>{textInput.length} characters</span>
                <span>Max 10,000 characters suggested</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-0">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group"
              onClick={() => imageInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={imageInputRef} 
                accept="image/jpeg,image/png" 
                onChange={handleFileChange}
              />
              <div className="bg-accent/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="text-accent h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-foreground">Click or Drag Image to Upload</p>
              <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG (Max 50MB)</p>
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="mt-0">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group"
              onClick={() => pdfInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={pdfInputRef} 
                accept="application/pdf" 
                onChange={handleFileChange}
              />
              <div className="bg-accent/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <File className="text-accent h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-foreground">Click or Drag PDF to Upload</p>
              <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
            </div>
          </TabsContent>

          <TabsContent value="pptx" className="mt-0">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group"
              onClick={() => pptxInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={pptxInputRef} 
                accept="application/vnd.openxmlformats-officedocument.presentationml.presentation" 
                onChange={handleFileChange}
              />
              <div className="bg-accent/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Presentation className="text-accent h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-foreground">Click or Drag PPTX to Upload</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PowerPoint (Max 50MB)</p>
            </div>
          </TabsContent>
        </Tabs>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-foreground px-1">Uploaded Assets ({files.length})</h4>
            <div className="grid gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border border-border group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <div className="h-10 w-10 rounded border overflow-hidden bg-white flex-shrink-0">
                        <img src={file.dataUri} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded border bg-white flex items-center justify-center flex-shrink-0">
                        {file.type.includes('presentation') ? <Presentation className="text-accent w-6 h-6" /> : <File className="text-accent w-6 h-6" />}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeFile(idx)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}