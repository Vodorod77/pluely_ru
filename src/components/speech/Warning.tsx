import { AlertCircleIcon } from "lucide-react";
import { Card } from "../ui/card";

export const Warning = () => {
  return (
    <div className="border-t border-input/50 pt-3 space-y-3">
      <Card className="p-3 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-2">
          <AlertCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-xs text-amber-900 mb-1">
              Experimental Feature
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              System audio capture is currently in beta.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
