"use client";

import React, { useState } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { StudentDashboard } from "@/components/StudentDashboard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { useLibrary } from "@/context/LibraryContext";

export default function DashboardPage() {
  const { student, books } = useLibrary();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const selectedBook = books.find((b) => b.id === selectedBookId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-12">
      <AppNavigation />

      <main
        id="main-content"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <StudentDashboard
          student={student}
          stats={student.stats}
          books={books}
          onSelectBook={(id) => setSelectedBookId(id)}
        />
      </main>

      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBookId(null)}
      />
    </div>
  );
}

