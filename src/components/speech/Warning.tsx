import { AlertCircleIcon } from "lucide-react";
import { Card } from "../ui/card";

export const Warning = () => {
  return (
    <div className="border-t border-input/50 pt-3 space-y-3">
      <Card className="p-3 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-2">
          <AlertCircleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-xs text-amber-900 mb-1">
              Known Issue
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              After turning off system audio, if you see the microphone is still
              active, please restart the app. I haven't been able to fix this
              issue yet - feel free to create a PR if you know how to solve it!
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-3 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-2">
          <AlertCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-xs text-amber-900 mb-1">
              Experimental Feature
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              System audio capture is currently in beta. Results may vary
              depending on your system configuration and audio setup. This
              feature will continue to improve in future versions. For the most
              reliable experience, consider using the microphone input option.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
