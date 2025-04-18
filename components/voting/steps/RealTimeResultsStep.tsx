import { Switch } from "@/components/shadcn-ui/switch";
import { Label } from "@/components/shadcn-ui/label";
import { InfoTooltip } from "@/components/voting/InfoTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card";
import {
  BarChart3,
  EyeIcon,
  EyeOffIcon,
  PieChart,
  LineChart,
  Users,
  Lock,
  CheckCircle,
  ChevronRight,
  Bell,
  Shield
} from "lucide-react";
import { Badge } from "@/components/shadcn-ui/badge";

interface RealTimeResultsStepProps {
  formData: {
    displayLiveResults: boolean;
  };
  updateFormData: (data: Partial<{
    displayLiveResults: boolean;
  }>) => void;
}

export function RealTimeResultsStep({ formData, updateFormData }: RealTimeResultsStepProps) {
  const handleToggleChange = (checked: boolean) => {
    updateFormData({ displayLiveResults: checked });
  };

  return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 mb-3">Results Visibility</h2>
          <p className="text-blue-700 mb-6">
            Choose how voting results are displayed to participants during the session.
          </p>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${formData.displayLiveResults ? "bg-blue-100" : "bg-gray-100"}`}>
                  {formData.displayLiveResults ?
                      <EyeIcon className="h-6 w-6 text-blue-600" /> :
                      <EyeOffIcon className="h-6 w-6 text-gray-500" />
                  }
                </div>
                <div>
                  <Label htmlFor="display-results" className="text-lg font-medium">
                    Display live results
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Show vote tallies and statistics in real-time as they arrive
                  </p>
                </div>
              </div>
              <Switch
                  id="display-results"
                  checked={formData.displayLiveResults}
                  onCheckedChange={handleToggleChange}
                  className="scale-125 data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Results Card */}
          <Card className={`overflow-hidden border-2 transition-all duration-200 ${
              formData.displayLiveResults ? "border-blue-400 shadow-md" : "border-gray-200"
          }`}>
            <div className={`h-2 ${formData.displayLiveResults ? "bg-blue-500" : "bg-gray-200"}`}></div>
            <CardHeader className={`pb-3 ${!formData.displayLiveResults && "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <EyeIcon className={`h-5 w-5 mr-2 ${formData.displayLiveResults ? "text-blue-500" : "text-gray-400"}`} />
                  Live Results Enabled
                </CardTitle>
                {formData.displayLiveResults && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Current Selection
                    </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className={`${!formData.displayLiveResults && "opacity-60"}`}>
              <div className="space-y-5">
                {/* Feature Highlights */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {[
                      { icon: BarChart3, text: "Real-time vote counts and percentages" },
                      { icon: PieChart, text: "Interactive charts and visualizations" },
                      { icon: Bell, text: "Live updates as each vote is cast" },
                      { icon: Users, text: "Participation metrics and demographics" }
                    ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                            <item.icon className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm ml-2">{item.text}</span>
                        </li>
                    ))}
                  </ul>
                </div>

                {/* Live Dashboard Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium text-sm">Live Results Dashboard</span>
                    </div>
                    <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-700 border-0">
                      <span className="animate-pulse mr-1">●</span> Live
                    </Badge>
                  </div>

                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {/* Stats Box */}
                      <div className="col-span-1">
                        <div className="space-y-2">
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
                            <div className="text-xs text-blue-600 font-medium">Total Votes</div>
                            <div className="text-xl font-bold text-blue-700">237</div>
                          </div>

                          <div className="bg-green-50 border border-green-100 rounded-lg p-2 text-center">
                            <div className="text-xs text-green-600 font-medium">Participation</div>
                            <div className="text-xl font-bold text-green-700">86%</div>
                          </div>
                        </div>
                      </div>

                      {/* Results Chart */}
                      <div className="col-span-3">
                        <div className="space-y-4">
                          {/* Option A */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                <span className="font-medium">Option A</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">152 votes</span>
                                <span className="font-bold">64%</span>
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: "64%" }}></div>
                            </div>
                          </div>

                          {/* Option B */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                                <span className="font-medium">Option B</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">85 votes</span>
                                <span className="font-bold">36%</span>
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" style={{ width: "36%" }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Chart Options */}
                        <div className="flex space-x-2 justify-end mt-4">
                          <div className="flex items-center bg-blue-100 text-blue-700 rounded-full text-xs px-2 py-1">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            <span>Bar</span>
                          </div>
                          <div className="flex items-center bg-gray-100 text-gray-600 rounded-full text-xs px-2 py-1">
                            <PieChart className="h-3 w-3 mr-1" />
                            <span>Pie</span>
                          </div>
                          <div className="flex items-center bg-gray-100 text-gray-600 rounded-full text-xs px-2 py-1">
                            <LineChart className="h-3 w-3 mr-1" />
                            <span>Line</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best For */}
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Best for:
                  </h4>
                  <ul className="space-y-1 pl-5 list-disc text-blue-800">
                    <li>Higher engagement and participation</li>
                    <li>Open and transparent voting processes</li>
                    <li>Encouraging real-time discussion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden Results Card */}
          <Card className={`overflow-hidden border-2 transition-all duration-200 ${
              !formData.displayLiveResults ? "border-gray-400 shadow-md" : "border-gray-200"
          }`}>
            <div className={`h-2 ${!formData.displayLiveResults ? "bg-gray-500" : "bg-gray-200"}`}></div>
            <CardHeader className={`pb-3 ${formData.displayLiveResults && "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <EyeOffIcon className={`h-5 w-5 mr-2 ${!formData.displayLiveResults ? "text-gray-700" : "text-gray-400"}`} />
                  Results Hidden Until End
                </CardTitle>
                {!formData.displayLiveResults && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                      Current Selection
                    </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className={`${formData.displayLiveResults && "opacity-60"}`}>
              <div className="space-y-5">
                {/* Feature Highlights */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {[
                      { icon: Shield, text: "Prevents voting influence from early trends" },
                      { icon: Users, text: "Shows only participation count, not choices" },
                      { icon: CheckCircle, text: "Individual vote confirmation provided" },
                      { icon: Lock, text: "Results revealed only after voting ends" }
                    ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="bg-gray-200 p-1 rounded-full mt-0.5">
                            <item.icon className="h-3 w-3 text-gray-600" />
                          </div>
                          <span className="text-sm ml-2">{item.text}</span>
                        </li>
                    ))}
                  </ul>
                </div>

                {/* Hidden Results Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="font-medium text-sm">Voter View</span>
                    </div>
                    <Badge className="bg-gray-200 hover:bg-gray-200 text-gray-700 border-0">
                      Results Hidden
                    </Badge>
                  </div>

                  <div className="p-4 bg-white">
                    <div className="space-y-4">
                      {/* Confirmation */}
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                        <p className="font-medium text-green-700">Thank you for voting!</p>
                        <p className="text-xs text-green-600 mt-1">Your vote has been securely recorded</p>
                      </div>

                      {/* Participation Stats */}
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Participation Progress</span>
                          <span className="text-sm font-bold">63%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-gray-500 rounded-full" style={{ width: "63%" }}></div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-2">
                          237 out of 376 eligible voters have participated
                        </p>
                      </div>

                      {/* Hidden Results */}
                      <div className="border border-gray-200 border-dashed rounded-lg p-5 flex flex-col items-center justify-center">
                        <Lock className="h-8 w-8 text-gray-400 mb-3" />
                        <p className="text-gray-500 text-center font-medium">Results are hidden until voting ends</p>
                        <p className="text-gray-400 text-xs text-center mt-1">
                          Results will be available on April 25, 2025 at 6:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best For */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Best for:
                  </h4>
                  <ul className="space-y-1 pl-5 list-disc text-gray-700">
                    <li>Preventing voter influence from early results</li>
                    <li>More objective voting processes</li>
                    <li>Contentious or sensitive topics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-6 bg-gray-50 border rounded-lg p-4 text-sm text-gray-600">
          <h3 className="font-medium flex items-center text-gray-700 mb-2">
            <InfoTooltip text="Important information about results visibility" className="mr-2" />
            Additional Information
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <ChevronRight className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
              <span>This setting cannot be changed once voting has started.</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
              <span>Administrators always have access to live results regardless of this setting.</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
              <span>Final results will be available to all participants after the voting session ends.</span>
            </li>
          </ul>
        </div>
      </div>
  );
}