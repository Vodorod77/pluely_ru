import { AlertCircleIcon } from "lucide-react";
import { Card } from "../ui/card";
import { useEffect, useState } from "react";
import { shouldUsePluelyAPI } from "@/lib/functions/pluely.api";

export const Warning = () => {
  const [usePluelyAPI, setUsePluelyAPI] = useState(false);

  useEffect(() => {
    const getUsePluelyAPI = async () => {
      const usePluelyAPI = await shouldUsePluelyAPI();
      setUsePluelyAPI(usePluelyAPI);
    };
    getUsePluelyAPI();
  }, []);

  return (
    <div className="border-t border-input/50 pt-3 space-y-3">
      {usePluelyAPI ? (
        <Card className="p-3 bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-xs text-amber-900 mb-1">
                Limitations
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Pluely API is currently running with limitations(~60-120 minutes
                per day), if you need more usage quota, contact
                support@pluely.com.
              </p>
            </div>
          </div>
        </Card>
      ) : null}
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
              feature will continue to improve in future versions. you can
              always change the settings to make it work with your system, and
              as per your needs.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
