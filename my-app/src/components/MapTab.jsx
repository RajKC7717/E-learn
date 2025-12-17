import MapSubjectGrid from '../components/MapSubjectGrid';

export default function MapTab() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* We just render the grid here. 
        Clicking items will take us to new pages. 
      */}
      <MapSubjectGrid />
    </div>
  );
}