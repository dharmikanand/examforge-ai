
"use client"

import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuAction,
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { FileText, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

interface StudyLibraryProps {
  onSelectSession: (session: any) => void;
}

export function StudyLibrary({ onSelectSession }: StudyLibraryProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'studyMaterials'),
      orderBy('uploadDateTime', 'desc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: materials, isLoading } = useCollection(sessionsQuery);

  const handleDelete = (e: React.MouseEvent, materialId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore || !user) return;
    const materialRef = doc(firestore, 'users', user.uid, 'studyMaterials', materialId);
    deleteDocumentNonBlocking(materialRef);
  };

  return (
    <Sidebar className="bg-primary text-white border-r border-white/10">
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-lg">
          <FileText className="text-accent" />
          Study Library
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 px-4 py-2 text-[10px] uppercase tracking-widest font-bold">
            Recent Analyses
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-4 space-y-2 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-full bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : materials && materials.length > 0 ? (
                materials.map((material) => (
                  <SidebarMenuItem key={material.id}>
                    <SidebarMenuButton 
                      onClick={() => {
                        onSelectSession({
                          generatedContent: material.generatedContent || null,
                          intelligenceModeId: material.intelligenceModeId || 'survival'
                        });
                      }}
                      className="hover:bg-white/10 text-white/80 hover:text-white px-4 h-auto py-3 transition-colors pr-10"
                    >
                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm truncate">{material.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <Clock size={10} />
                          <span>{material.uploadDateTime ? format(new Date(material.uploadDateTime), 'MMM d, h:mm a') : 'Recently'}</span>
                          <span className="mx-1">•</span>
                          <span className="capitalize">{(material.contentType || 'text').split('/').pop()?.toLowerCase()}</span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction 
                      onClick={(e) => handleDelete(e, material.id)}
                      className="text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                      showOnHover
                    >
                      <Trash2 size={12} />
                      <span className="sr-only">Delete session</span>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-6 py-10 text-center">
                  <p className="text-xs text-white/30">No saved analyses yet.</p>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
