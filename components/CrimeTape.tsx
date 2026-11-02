/** Atmospheric escape room containment strip with Photo 1 investigation styling. Decorative. */
export default function CrimeTape({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`crime-tape ${className}`}>
      {Array.from({ length: 10 }, () => "🔑 ESCAPE.EXE · SOLVE THE PUZZLES · FIND THE KEYS · UNLOCK THE EXIT · ESCAPE ROOM ACTIVE · ").join("")}
    </div>
  );
}
