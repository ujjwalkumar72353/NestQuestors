import { Home } from "lucide-react";
import { useState } from "react";

function Photo({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-raised text-muted flex items-center justify-center ${className}`}
      >
        <Home size={28} aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

export default Photo;
