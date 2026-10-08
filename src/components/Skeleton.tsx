export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}
