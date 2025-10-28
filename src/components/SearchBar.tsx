import { Search, LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, type KeyboardEvent } from "react";

interface SearchBarProps {
  onSearch: (location: string) => void;
  onUseMyLocation?: () => void;
}

const SearchBar = ({ onSearch, onUseMyLocation }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
  <div className="flex gap-2 w-full max-w-2xl animate-fade-in">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Search cities in India or worldwide..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 bg-card/80 backdrop-blur-sm border-border focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button 
        onClick={handleSearch}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Search
      </Button>
      {onUseMyLocation && (
        <Button
          type="button"
          onClick={onUseMyLocation}
          variant="outline"
          className="gap-2"
          title="Use my current location"
        >
          <LocateFixed className="w-4 h-4" />
          Use my location
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
