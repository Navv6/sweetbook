import type { PageElement } from "@/types/project";

import { Input } from "@/components/ui/Input";

export function InspectorPanel({
  selectedElement,
  textDraft,
  cropDraft,
  onTextChange,
  onCropChange,
  onImageReplace,
}: {
  selectedElement: PageElement | null;
  textDraft: string;
  cropDraft: { x: number; y: number; scale: number };
  onTextChange: (value: string) => void;
  onCropChange: (key: "x" | "y" | "scale", value: number) => void;
  onImageReplace: (file: File) => void;
}) {
  return (
    <aside className="glass-panel rounded-[1.75rem] p-6">
      <p className="section-label">
        {"\uC778\uC2A4\uD399\uD130"}
      </p>
      {!selectedElement && (
        <div className="mt-6 rounded-2xl bg-surface-container-low p-5">
          <p className="display-copy text-2xl italic text-foreground">
            {"Waiting"}
          </p>
          <p className="editorial-copy mt-3 text-sm">
            {
              "\uC911\uC559 \uC2A4\uD504\uB808\uB4DC\uC5D0\uC11C \uD14D\uC2A4\uD2B8 \uB610\uB294 \uC774\uBBF8\uC9C0\uB97C \uC120\uD0DD\uD558\uBA74 \uC5EC\uAE30\uC11C \uBC14\uB85C \uD3B8\uC9D1\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
            }
          </p>
        </div>
      )}

      {selectedElement?.type === "text" && (
        <div className="mt-6 space-y-5">
          <div>
            <p className="display-copy text-2xl italic text-foreground">
              {"Text Block"}
            </p>
            <p className="editorial-copy mt-2 text-sm">
              {
                "\uD45C\uC9C0 \uCE74\uD53C, \uC139\uC158 \uC81C\uBAA9, \uBCF8\uBB38 \uBB38\uC7A5\uC744 \uCD9C\uD310 \uD1A4\uC5D0 \uB9DE\uAC8C \uC870\uC815\uD569\uB2C8\uB2E4."
              }
            </p>
          </div>
          <Input
            value={textDraft}
            onChange={(event) => onTextChange(event.target.value)}
          />
        </div>
      )}

      {selectedElement?.type === "image" && (
        <div className="mt-6 space-y-6">
          <div>
            <p className="display-copy text-2xl italic text-foreground">
              {"Image Frame"}
            </p>
            <p className="editorial-copy mt-2 text-sm">
              {
                "\uC774\uBBF8\uC9C0 \uAD50\uCCB4\uC640 \uD06C\uB86D \uC870\uC815\uB9CC \uD5C8\uC6A9\uD558\uACE0, \uC790\uC720 \uBC30\uCE58\uB294 \uC81C\uD55C\uD569\uB2C8\uB2E4."
              }
            </p>
          </div>

          <label className="block rounded-2xl bg-surface-container-low p-5">
            <span className="section-label">
              {"\uC774\uBBF8\uC9C0 \uAD50\uCCB4"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="mt-4 block w-full text-sm text-secondary"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImageReplace(file);
                }
              }}
            />
          </label>

          <div className="rounded-2xl bg-surface-container-low p-5">
            <p className="section-label">
              {"\uD06C\uB86D \uC870\uC815"}
            </p>
            <div className="mt-4 space-y-4">
              {(["x", "y", "scale"] as const).map((key) => (
                <label key={key} className="block">
                  <div className="mb-2 flex items-center justify-between text-sm text-secondary">
                    <span className="uppercase">{key}</span>
                    <span>{cropDraft[key].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={key === "scale" ? 1 : 0}
                    max={key === "scale" ? 2.5 : 1}
                    step={0.01}
                    value={cropDraft[key]}
                    onChange={(event) =>
                      onCropChange(key, Number(event.target.value))
                    }
                    className="w-full accent-[var(--primary)]"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
