'use client';
import Link from "next/link";
import React from 'react';
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { FileText, Download, FileCode, FileArchive, FileImage, FileVideo, FileAudio, File, FolderOpen, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type FileItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  iconClass: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Download,
  FileCode,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  File,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export function FilesSection() {
  const firestore = useFirestore();

  const filesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "files"), orderBy("timestamp", "desc"));
  }, [firestore]);

  const { data: files, isLoading: filesLoading } = useCollection<FileItem>(filesCollection, false);

  const validFiles = files?.filter(f => f.fileName && f.fileUrl && f.iconClass);

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || File;
    return <IconComponent className="w-10 h-10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]" />;
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden" dir="rtl">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-gradient-gold tracking-wider">الموارد</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            مكتبة <span className="text-gradient-gold">المخطوطات</span>
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            تصفح وحمل الملفات والموارد الحصرية لمجتمعنا
          </p>
        </motion.div>

        {filesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass border border-border/30 rounded-2xl p-6 flex flex-col items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <Skeleton className="w-3/4 h-5 rounded" />
                <Skeleton className="w-full h-12 rounded-xl" />
              </div>
            ))}
          </div>
        ) : validFiles && validFiles.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"
          >
            {validFiles.map((file) => (
              <motion.div
                key={file.id}
                variants={itemVariants}
                className="group"
              >
                <div className="relative h-full p-6 rounded-2xl glass-card border border-border/30 hover:border-primary/50 transition-all duration-500 text-center hover:-translate-y-3 hover:shadow-[0_8px_40px_rgba(255,215,0,0.15)] flex flex-col items-center min-h-[220px]">
                  {/* Glass reflection effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
                  
                  {/* Icon container */}
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 border border-primary/10 group-hover:border-primary/30">
                    {renderIcon(file.iconClass)}
                  </div>

                  {/* File name */}
                  <h3 className="relative text-base font-bold text-foreground mb-5 leading-relaxed line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
                    {file.fileName}
                  </h3>

                  {/* Download button */}
                  <Button
                    asChild
                    className="relative w-full bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/30 hover:border-primary font-bold transition-all duration-300 group/btn hover:scale-105"
                  >
                    <Link href={file.fileUrl} target="_blank" download className="flex items-center justify-center gap-2">
                      <Download className="w-4 h-4 group-hover/btn:animate-bounce" />
                      <span>تحميل الملف</span>
                    </Link>
                  </Button>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-primary to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right rounded-b-2xl" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 rounded-2xl glass border border-dashed border-border/40"
          >
            <div className="inline-flex p-5 rounded-full bg-primary/10 mb-6">
              <FolderOpen className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">لا توجد ملفات متاحة حالياً</p>
            <p className="text-muted-foreground/60 text-sm mt-2">سيتم إضافة الملفات قريباً...</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
