import React from 'react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

//create a type for codeExamples so it can support multiple coding languages
type CodeExamples = {
  [key: string]: React.ReactNode;
};

interface AlgorithmLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  controls: React.ReactNode;
  codeExamples?: CodeExamples;
  className?: string;
}

export function AlgorithmLayout({
  title,
  description,
  children,
  sidebar,
  controls,
  codeExamples,
  className
}: AlgorithmLayoutProps) {
  console.log(codeExamples)
  return (
    <div className={cn("container mx-auto px-4 py-8", className)}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6 p-4 bg-gradient-card shadow-soft">
        {controls}
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Visualization Area */}
        <div className='flex flex-col lg:col-span-3'>
        <div className="lg:col-span-3">
          <Card className="p-6 bg-gradient-card shadow-medium min-h-[400px]">
            {children}
          </Card>
        </div>

        
        {/* Code Example */}
        {
          codeExamples && (
                 <div className="lg:col-span-1">
          <Card className="p-6 bg-gradient-card shadow-medium sticky top-24">
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="justify-start mb-4">
                {Object.keys(codeExamples).map((lang) => (
                  <TabsTrigger key={lang} value={lang}>
                    {lang}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.keys(codeExamples).map((lang) => (
                <TabsContent key={lang} value={lang}>
                  {codeExamples[lang]}
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-gradient-card shadow-medium sticky top-24">
            {sidebar}
          </Card>
        </div>
      </div>
    </div>
  );
}