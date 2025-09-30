import { GithubIcon } from "lucide-react";
import { useVersion } from "@/hooks";
import { useApp } from "@/contexts";

export const Disclaimer = () => {
  const { version, isLoading: isVersionLoading } = useVersion();
  const { hasActiveLicense } = useApp();
  return (
    <div className="flex items-center justify-between py-4 px-4">
      <div className="flex flex-row items-center gap-2">
        <a
          href="https://github.com/iamsrikanthnani/pluely/issues/new?template=bug-report.yml"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
        >
          Report a bug
        </a>
        {hasActiveLicense && (
          <>
            <span className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              •
            </span>
            <a
              href="mailto:support@pluely.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              Contact Support
            </a>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground/70 leading-relaxed">
          {isVersionLoading ? (
            <span>Loading version...</span>
          ) : (
            <span>Version: {version}</span>
          )}
        </div>

        <a
          href="https://github.com/iamsrikanthnani/pluely"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <GithubIcon className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};
