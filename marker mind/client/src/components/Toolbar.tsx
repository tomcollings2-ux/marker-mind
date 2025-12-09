import { Pen, Save, Trash2, MousePointer2, Type, Minus, X, ChevronDown, Layout, Users, Target, Lightbulb, Grid3X3, ArrowUpDown, ImagePlus, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
type Tool = 'cursor' | 'pen' | 'text' | 'line';
type PresetType = 'kanban' | 'swot' | 'persona' | 'brainstorm' | 'pros_cons' | 'timeline' | 'rocket';

interface ToolSettings {
  penColor: string;
  penThickness: number;
  lineColor: string;
  lineThickness: number;
  textColor: string;
  textSize: number;
}

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onAddNote: (color: NoteColor) => void;
  onClearBoard: () => void;
  onSave: () => void;
  onLoadPreset: (preset: PresetType) => void;
  onDeleteSelected?: () => void;
  hasSelection?: boolean;
  onUploadImage?: (file: File) => void;
  toolSettings?: ToolSettings;
  onToolSettingsChange?: (settings: Partial<ToolSettings>) => void;
}

const presets: { id: PresetType; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'kanban', name: 'Kanban Board', icon: Layout, description: 'To Do, In Progress, Done' },
  { id: 'swot', name: 'SWOT Analysis', icon: Grid3X3, description: 'Strengths, Weaknesses, Opportunities, Threats' },
  { id: 'persona', name: 'User Persona', icon: Users, description: 'Name, Goals, Frustrations' },
  { id: 'brainstorm', name: 'Brainstorm', icon: Lightbulb, description: 'Central idea with branches' },
  { id: 'pros_cons', name: 'Pros & Cons', icon: ArrowUpDown, description: 'Two-column comparison' },
  { id: 'timeline', name: 'Timeline', icon: Target, description: 'Sequential steps' },
];

const defaultToolSettings: ToolSettings = {
  penColor: '#000000',
  penThickness: 3,
  lineColor: '#000000',
  lineThickness: 3,
  textColor: '#000000',
  textSize: 24,
};

const colorOptions = ['#000000', '#333333', '#666666', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const thicknessOptions = [1, 2, 3, 5, 8, 12];
const textSizeOptions = [14, 18, 24, 32, 48, 64];

export function Toolbar({ 
  currentTool, 
  onToolChange, 
  onAddNote, 
  onClearBoard,
  onSave,
  onLoadPreset,
  onDeleteSelected,
  hasSelection,
  onUploadImage,
  toolSettings = defaultToolSettings,
  onToolSettingsChange
}: ToolbarProps) {
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onUploadImage) {
        onUploadImage(file);
      }
    };
    input.click();
  };
  const isActive = (tool: Tool) => currentTool === tool;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm z-50 px-4 py-2">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        
        {/* Left: Tools */}
        <div className="flex items-center gap-4">
          
          {/* Tools */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToolChange('cursor')}
                  className={cn("rounded-md h-8 w-8", isActive('cursor') && "bg-white shadow-sm")}
                  data-testid="tool-cursor"
                >
                  <MousePointer2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select & Move</TooltipContent>
            </Tooltip>

            {/* Pen Tool with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); onToolChange('pen'); }}
                  className={cn("rounded-md h-8 w-8 relative", isActive('pen') && "bg-white shadow-sm")}
                  data-testid="tool-pen"
                >
                  <Pen className="w-4 h-4" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: toolSettings.penColor }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2">
                <DropdownMenuLabel>Pen Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <p className="text-xs text-gray-500 mb-1">Color</p>
                  <div className="grid grid-cols-5 gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => onToolSettingsChange?.({ penColor: color })}
                        className={cn("w-6 h-6 rounded border", toolSettings.penColor === color && "ring-2 ring-primary")}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-1 mt-2">
                  <p className="text-xs text-gray-500 mb-1">Thickness</p>
                  <div className="flex gap-1">
                    {thicknessOptions.map((t) => (
                      <button
                        key={t}
                        onClick={() => onToolSettingsChange?.({ penThickness: t })}
                        className={cn("flex-1 h-8 rounded border flex items-center justify-center text-xs", toolSettings.penThickness === t && "bg-primary text-white")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Line Tool with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); onToolChange('line'); }}
                  className={cn("rounded-md h-8 w-8 relative", isActive('line') && "bg-white shadow-sm")}
                  data-testid="tool-line"
                >
                  <Minus className="w-4 h-4" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: toolSettings.lineColor }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2">
                <DropdownMenuLabel>Line Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <p className="text-xs text-gray-500 mb-1">Color</p>
                  <div className="grid grid-cols-5 gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => onToolSettingsChange?.({ lineColor: color })}
                        className={cn("w-6 h-6 rounded border", toolSettings.lineColor === color && "ring-2 ring-primary")}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-1 mt-2">
                  <p className="text-xs text-gray-500 mb-1">Thickness</p>
                  <div className="flex gap-1">
                    {thicknessOptions.map((t) => (
                      <button
                        key={t}
                        onClick={() => onToolSettingsChange?.({ lineThickness: t })}
                        className={cn("flex-1 h-8 rounded border flex items-center justify-center text-xs", toolSettings.lineThickness === t && "bg-primary text-white")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Text Tool with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); onToolChange('text'); }}
                  className={cn("rounded-md h-8 w-8 relative", isActive('text') && "bg-white shadow-sm")}
                  data-testid="tool-text"
                >
                  <Type className="w-4 h-4" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: toolSettings.textColor }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2">
                <DropdownMenuLabel>Text Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <p className="text-xs text-gray-500 mb-1">Color</p>
                  <div className="grid grid-cols-5 gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => onToolSettingsChange?.({ textColor: color })}
                        className={cn("w-6 h-6 rounded border", toolSettings.textColor === color && "ring-2 ring-primary")}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-1 mt-2">
                  <p className="text-xs text-gray-500 mb-1">Size</p>
                  <div className="flex gap-1 flex-wrap">
                    {textSizeOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => onToolSettingsChange?.({ textSize: s })}
                        className={cn("px-2 h-7 rounded border flex items-center justify-center text-xs", toolSettings.textSize === s && "bg-primary text-white")}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center: Logo & Notes & Templates */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-marker text-gray-800">MarkerMind</h1>
          <Separator orientation="vertical" className="h-6" />
          {/* Quick Notes Dropdown with improved color picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="add-note-dropdown">
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-sm bg-note-yellow" />
                  <div className="w-3 h-3 rounded-sm bg-note-pink" />
                  <div className="w-3 h-3 rounded-sm bg-note-blue" />
                </div>
                Add Note
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 p-3">
              <DropdownMenuLabel className="pb-2">Quick Colors</DropdownMenuLabel>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {(['yellow', 'pink', 'blue', 'green', 'orange'] as NoteColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => onAddNote(color)}
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 border-black/10 hover:scale-110 transition-transform shadow-sm",
                      {
                        'bg-note-yellow': color === 'yellow',
                        'bg-note-pink': color === 'pink',
                        'bg-note-blue': color === 'blue',
                        'bg-note-green': color === 'green',
                        'bg-note-orange': color === 'orange',
                      }
                    )}
                    data-testid={`add-note-${color}`}
                    title={`${color} note`}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="pt-2 pb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Custom Color
              </DropdownMenuLabel>
              <div className="flex gap-2 items-center px-1">
                <input 
                  type="color" 
                  id="custom-note-color"
                  defaultValue="#f5e6ab"
                  className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                  data-testid="custom-color-picker"
                />
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    const input = document.getElementById('custom-note-color') as HTMLInputElement;
                    if (input) {
                      onAddNote(input.value as NoteColor);
                    }
                    e.stopPropagation();
                  }}
                  data-testid="add-custom-note"
                >
                  Add Custom Note
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Upload Image Button */}
          {onUploadImage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleImageUpload} data-testid="upload-image">
                  <ImagePlus className="w-4 h-4" />
                  Image
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload Image</TooltipContent>
            </Tooltip>
          )}

          {/* Templates Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="templates-dropdown">
                <Layout className="w-4 h-4" />
                Templates
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              <DropdownMenuLabel>Quick Start Templates</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {presets.map((preset) => (
                <DropdownMenuItem 
                  key={preset.id}
                  onClick={() => onLoadPreset(preset.id)}
                  className="gap-3 cursor-pointer py-2"
                  data-testid={`preset-${preset.id}`}
                >
                  <preset.icon className="w-5 h-5 text-gray-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-xs text-gray-500">{preset.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {hasSelection && onDeleteSelected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onDeleteSelected} 
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 gap-1"
                  data-testid="delete-selected"
                >
                  <X className="w-4 h-4" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Selected</TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onSave} className="gap-1 hover:bg-green-50 hover:text-green-600" data-testid="save-board">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto-saved</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onClearBoard} className="gap-1 text-red-500 hover:bg-red-50 hover:text-red-600" data-testid="clear-board">
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Board</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
