import { useBranding } from "@/config/brand";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
};

export const BrandLogo = ({
  className = "",
  imageClassName = "",
}: BrandLogoProps) => {
  const { brandPreset } = useBranding();

  return (
    <div className={className}>
      <img
        src={brandPreset.logoSrc}
        alt={`Logo ${brandPreset.organizationName}`}
        className={imageClassName}
      />
    </div>
  );
};
