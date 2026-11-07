"use client";

import React, { useState, useRef } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BookOpen, Sparkles } from "lucide-react";
import { BookCardProps } from "@/components/BookCard";

export type ShelfBookItem = Omit<BookCardProps, "onSelect">;

interface BookMeshProps {
  book: ShelfBookItem;
  index: number;
  total: number;
  isFocused: boolean;
  onHover: (idx: number | null) => void;
  onSelect: (bookId: string) => void;
}

const CATEGORY_SPINE_COLORS: Record<BookCardProps["category"], string> = {
  fiksi: "#7C3AED", // Violet 600
  sains: "#0284C7", // Sky 600
  sejarah: "#B45309", // Amber 700
  komik: "#E11D48", // Rose 600
};

function InteractiveBookMesh({
  book,
  index,
  total,
  isFocused,
  onHover,
  onSelect,
}: BookMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const active = hovered || isFocused;

  // Posisi X berjejer rapi di atas rak kayu
  const spacing = 1.05;
  const startX = -((total - 1) * spacing) / 2;
  const baseX = startX + index * spacing;

  // Frame-independent damping sesuai DESIGN.md Section 6.1 & 6.2
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetZ = active ? 0.45 : 0;
    const targetY = active ? 0.18 : 0;
    const targetRotY = active ? -0.32 : -0.06;

    groupRef.current.position.z = THREE.MathUtils.damp(
      groupRef.current.position.z,
      targetZ,
      6,
      delta
    );
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      6,
      delta
    );
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      6,
      delta
    );

    if (
      Math.abs(groupRef.current.position.z - targetZ) > 0.005 ||
      Math.abs(groupRef.current.rotation.y - targetRotY) > 0.005
    ) {
      state.invalidate();
    }
  });

  const spineColor = CATEGORY_SPINE_COLORS[book.category] || "#0F766E";

  return (
    <group
      ref={groupRef}
      position={[baseX, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(index);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(book.id);
      }}
    >
      {/* Badan Sampul Buku (BoxGeometry Prosedural Ringan) */}
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[0.72, 1.55, 0.22]} />
        <meshStandardMaterial
          color={spineColor}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>

      {/* Kertas Halaman Buku di Bagian Dalam */}
      <mesh position={[0.02, 0.85, 0]}>
        <boxGeometry args={[0.7, 1.48, 0.18]} />
        <meshStandardMaterial color="#FAF8F5" roughness={0.85} />
      </mesh>

      {/* Pita Emas/Aksen di Punggung Buku */}
      <mesh position={[0, 1.35, 0.115]}>
        <boxGeometry args={[0.58, 0.16, 0.01]} />
        <meshStandardMaterial color="#FBBF24" roughness={0.3} />
      </mesh>

      {/* Tooltip HTML Mengambang saat Hover/Fokus */}
      {active && (
        <Html
          position={[0, 1.9, 0.3]}
          center
          distanceFactor={6}
          zIndexRange={[20, 0]}
        >
          <div className="w-48 rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 text-card-foreground shadow-xl pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                {book.gradeLevel} • {book.category}
              </span>
              {book.progressPercent !== undefined && book.progressPercent > 0 && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {book.progressPercent}%
                </span>
              )}
            </div>
            <p className="text-xs font-bold leading-snug line-clamp-2 text-foreground">
              {book.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {book.author}
            </p>
            <button
              type="button"
              onClick={() => onSelect(book.id)}
              className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <BookOpen className="h-3 w-3" />
              Buka Buku
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

function WoodenShelfGeometry() {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Papan Kayu Utama (#8B5A2B dengan roughness tinggi sesuai DESIGN.md 4.2) */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[7.4, 0.18, 1.2]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Penyangga Samping Kiri & Kanan */}
      <mesh receiveShadow position={[-3.6, 0.85, 0]}>
        <boxGeometry args={[0.18, 1.85, 1.2]} />
        <meshStandardMaterial color="#6E4720" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[3.6, 0.85, 0]}>
        <boxGeometry args={[0.18, 1.85, 1.2]} />
        <meshStandardMaterial color="#6E4720" roughness={0.9} />
      </mesh>
      {/* Panel Belakang Rak */}
      <mesh receiveShadow position={[0, 0.85, -0.55]}>
        <boxGeometry args={[7.4, 1.85, 0.08]} />
        <meshStandardMaterial color="#5C3A18" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function Bookshelf3DCanvas({
  books,
  onBookClick,
}: {
  books: ShelfBookItem[];
  onBookClick: (bookId: string) => void;
}) {
  const shelfBooks = books.slice(0, 6);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev === null ? 0 : (prev + 1) % shelfBooks.length
      );
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev === null
          ? shelfBooks.length - 1
          : (prev - 1 + shelfBooks.length) % shelfBooks.length
      );
    } else if (e.key === "Enter" && focusedIndex !== null) {
      e.preventDefault();
      onBookClick(shelfBooks[focusedIndex].id);
    }
  };

  return (
    <div
      className="relative h-[360px] w-full rounded-2xl border border-border bg-gradient-to-b from-secondary/70 via-card to-secondary/40 overflow-hidden shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Rak Buku 3D Interaktif. Gunakan tombol Panah Kiri dan Panah Kanan untuk memilih buku, lalu tekan Enter untuk membuka."
    >
      {/* Petunjuk Interaksi di Pojok Kiri Atas */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 rounded-full bg-background/85 backdrop-blur-sm border border-border px-3 py-1 text-xs font-medium text-muted-foreground pointer-events-none">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span>Arahkan kursor atau tekan Panah Kiri/Kanan untuk melihat buku di rak 3D</span>
      </div>

      {/* Daftar Aksesibel untuk Screen Reader (Section 4.2 A11y) */}
      <ul className="sr-only">
        {shelfBooks.map((book, idx) => (
          <li key={book.id}>
            <button
              type="button"
              onFocus={() => setFocusedIndex(idx)}
              onClick={() => onBookClick(book.id)}
            >
              {book.title} oleh {book.author}, Jenjang {book.gradeLevel}
            </button>
          </li>
        ))}
      </ul>

      <Canvas
        frameloop="demand"
        shadows
        camera={{ position: [0, 1.15, 4.3], fov: 38 }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={1.1}
          castShadow
        />
        <pointLight position={[-3, 2, 2]} intensity={0.4} color="#FDE68A" />

        <group position={[0, -0.35, 0]}>
          <WoodenShelfGeometry />
          {shelfBooks.map((book, idx) => (
            <InteractiveBookMesh
              key={book.id}
              book={book}
              index={idx}
              total={shelfBooks.length}
              isFocused={focusedIndex === idx}
              onHover={(hoveredIdx) => setFocusedIndex(hoveredIdx)}
              onSelect={onBookClick}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
