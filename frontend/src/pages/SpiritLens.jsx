import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import ImageUpload, {
  generateSampleAstronomyFile,
} from "../components/features/spirit-lens/ImageUpload";
import ImageCompareSlider from "../components/features/spirit-lens/ImageCompareSlider";
import ScanMetrics from "../components/features/spirit-lens/ScanMetrics";
import { restoreImage } from "../services/spiritLensApi";

export default function SpiritLens() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [strength, setStrength] = useState(0.75);
  const [restoredImage, setRestoredImage] = useState("");
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState("ALL");

  // Preload a sample noisy astronomical frame on mount so users can test immediately
  useEffect(() => {
    let active = true;
    generateSampleAstronomyFile().then((file) => {
      if (!active) return;
      setSelectedFile((current) => current || file);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setOriginalPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setOriginalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function handleFileSelect(file) {
    setSelectedFile(file);
    setRestoredImage("");
    setStars([]);
    setSelectedStar(null);
    setError("");
  }

  function handleReset() {
    setSelectedFile(null);
    setRestoredImage("");
    setStars([]);
    setSelectedStar(null);
    setError("");
    setActiveTypeFilter("ALL");
  }

  async function handleRestore() {
    if (!selectedFile) return;
    setLoading(true);
    setError("");
    setSelectedStar(null);

    try {
      const result = await restoreImage(selectedFile, strength);
      setRestoredImage(result.restoredImage || "");
      setStars(Array.isArray(result.stars) ? result.stars : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete astronomical image restoration."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Spirit Lens Restoration Workspace */}
      <section
        id="spirit-lens-upload"
        className="relative isolate z-10 rounded-[22px] border border-[#e2c494]/16 bg-[#080e19] p-5 sm:p-7"
      >
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <ShieldAlert size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ImageUpload
            selectedFile={selectedFile}
            strength={strength}
            onFileSelect={handleFileSelect}
            onStrengthChange={setStrength}
            onRestore={handleRestore}
            onReset={handleReset}
            loading={loading}
          />

          <div className="flex min-w-0 flex-col gap-6">
            <ImageCompareSlider
              originalImage={originalPreviewUrl}
              restoredImage={restoredImage}
              stars={stars}
              showOverlay={showOverlay}
              onToggleOverlay={() => setShowOverlay((v) => !v)}
              selectedStar={selectedStar}
              onSelectStar={setSelectedStar}
              activeTypeFilter={activeTypeFilter}
            />

            <ScanMetrics
              stars={stars}
              strength={strength}
              restoredImage={restoredImage}
              selectedStar={selectedStar}
              onSelectStar={setSelectedStar}
              activeTypeFilter={activeTypeFilter}
              onTypeFilterChange={setActiveTypeFilter}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
