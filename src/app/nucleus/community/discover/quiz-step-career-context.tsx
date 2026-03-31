'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INDUSTRIES } from '@/lib/constants/organizations';
import type { EnhancedQuizData } from './enhanced-discovery-quiz';

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-50)' },
  { value: 'small', label: 'Small (51-200)' },
  { value: 'medium', label: 'Medium (201-1000)' },
  { value: 'large', label: 'Large (1001-5000)' },
  { value: 'enterprise', label: 'Enterprise (5000+)' },
];

interface QuizStepCareerContextProps {
  formData: EnhancedQuizData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuizData>>;
}

export function QuizStepCareerContext({ formData, setFormData }: QuizStepCareerContextProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currentRole" className="text-cyan-soft">
            Current Role / Title
          </Label>
          <Input
            id="currentRole"
            placeholder="e.g., Senior Clinical Research Associate"
            value={formData.currentRole}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, currentRole: e.target.value }))
            }
            className="border-cyan/30 bg-nex-light text-white placeholder:text-cyan-soft/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-cyan-soft">
            Industry
          </Label>
          <Select
            value={formData.currentIndustry}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, currentIndustry: value }))
            }
          >
            <SelectTrigger className="border-cyan/30 bg-nex-light text-white">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="experience" className="text-cyan-soft">
            Years of Experience
          </Label>
          <Select
            value={formData.yearsExperience}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, yearsExperience: value }))
            }
          >
            <SelectTrigger className="border-cyan/30 bg-nex-light text-white">
              <SelectValue placeholder="Select years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">Less than 1 year</SelectItem>
              <SelectItem value="1-3">1-3 years</SelectItem>
              <SelectItem value="4-7">4-7 years</SelectItem>
              <SelectItem value="8-12">8-12 years</SelectItem>
              <SelectItem value="13+">13+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companySize" className="text-cyan-soft">
            Company Size
          </Label>
          <Select
            value={formData.companySize}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                companySize: value as EnhancedQuizData['companySize'],
              }))
            }
          >
            <SelectTrigger className="border-cyan/30 bg-nex-light text-white">
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-cyan-soft/50 mt-4">
        All fields are optional. Share what you are comfortable with.
      </p>
    </div>
  );
}
