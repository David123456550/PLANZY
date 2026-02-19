"use client"

import { useState } from "react"
import { Search, X, Filter, Check, MapPin, FileText, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanCard } from "@/components/plan-card"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { categories } from "@/lib/mock-data"
import type { Plan } from "@/lib/types"

interface SearchScreenProps {
  onPlanSelect: (plan: Plan) => void
}

export function SearchScreen({ onPlanSelect }: SearchScreenProps) {
  const { plans, language } = useAppStore()
  const t = useTranslation(language)
  const [query, setQuery] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [locationFilter, setLocationFilter] = useState("")
  const [planNameFilter, setPlanNameFilter] = useState("")
  const [usernameFilter, setUsernameFilter] = useState("")
  const [activeFilterTab, setActiveFilterTab] = useState("interests")

  const filteredPlans = plans.filter((plan) => {
    const searchLower = query.toLowerCase()
    const matchesQuery =
      !query ||
      plan.title.toLowerCase().includes(searchLower) ||
      plan.location.name.toLowerCase().includes(searchLower) ||
      plan.location.city.toLowerCase().includes(searchLower) ||
      plan.creator.username.toLowerCase().includes(searchLower) ||
      plan.creator.name.toLowerCase().includes(searchLower)

    const matchesInterests =
      selectedInterests.length === 0 ||
      selectedInterests.some((interest) => plan.category.toLowerCase() === interest.toLowerCase())

    const matchesLocation =
      !locationFilter ||
      plan.location.name.toLowerCase().includes(locationFilter.toLowerCase()) ||
      plan.location.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
      plan.location.address.toLowerCase().includes(locationFilter.toLowerCase())

    const matchesPlanName = !planNameFilter || plan.title.toLowerCase().includes(planNameFilter.toLowerCase())

    const matchesUsername =
      !usernameFilter ||
      plan.creator.username.toLowerCase().includes(usernameFilter.toLowerCase()) ||
      plan.creator.name.toLowerCase().includes(usernameFilter.toLowerCase())

    return matchesQuery && matchesInterests && matchesLocation && matchesPlanName && matchesUsername
  })

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  const clearFilters = () => {
    setSelectedInterests([])
    setLocationFilter("")
    setPlanNameFilter("")
    setUsernameFilter("")
  }

  const activeFiltersCount =
    selectedInterests.length + (locationFilter ? 1 : 0) + (planNameFilter ? 1 : 0) + (usernameFilter ? 1 : 0)

  const interests = categories.filter((c) => c.id !== "all").map((c) => c.name)

  return (
    <div className="flex flex-col">
      {/* Search header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              className="pl-10 pr-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`relative ${activeFiltersCount > 0 ? "border-[#ef7418]" : ""}`}
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef7418] text-[10px] text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{t.allFilters}</SheetTitle>
              </SheetHeader>
              <Tabs value={activeFilterTab} onValueChange={setActiveFilterTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="interests" className="text-xs">
                    {t.filterByInterests}
                  </TabsTrigger>
                  <TabsTrigger value="location" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {language === "es" ? "Lugar" : "Place"}
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {language === "es" ? "Plan" : "Plan"}
                  </TabsTrigger>
                  <TabsTrigger value="user" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {language === "es" ? "Usuario" : "User"}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="interests" className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => {
                      const isSelected = selectedInterests.includes(interest)
                      return (
                        <Button
                          key={interest}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={isSelected ? "bg-[#1a95a4] hover:bg-[#1a95a4]/90 text-white" : "bg-transparent"}
                          onClick={() => toggleInterest(interest)}
                        >
                          {isSelected && <Check className="mr-1 h-3 w-3" />}
                          {interest}
                        </Button>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>{t.locationFilter}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={language === "es" ? "Ciudad, barrio o lugar..." : "City, neighborhood or place..."}
                        className="pl-10"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="plan" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>{t.planNameFilter}</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={language === "es" ? "Nombre del plan..." : "Plan name..."}
                        className="pl-10"
                        value={planNameFilter}
                        onChange={(e) => setPlanNameFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="user" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>{t.usernameFilter}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={language === "es" ? "Nombre de usuario..." : "Username..."}
                        className="pl-10"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-6 mt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  {t.clearAllFilters}
                </Button>
                <Button
                  className="flex-1 bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                  onClick={() => setFilterOpen(false)}
                >
                  {language === "es" ? "Aplicar" : "Apply"} ({filteredPlans.length})
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="bg-[#1a95a4]/10 text-[#1a95a4] cursor-pointer"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
            {locationFilter && (
              <Badge
                variant="secondary"
                className="bg-[#ef7418]/10 text-[#ef7418] cursor-pointer"
                onClick={() => setLocationFilter("")}
              >
                <MapPin className="mr-1 h-3 w-3" />
                {locationFilter}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            {planNameFilter && (
              <Badge
                variant="secondary"
                className="bg-[#ef7418]/10 text-[#ef7418] cursor-pointer"
                onClick={() => setPlanNameFilter("")}
              >
                <FileText className="mr-1 h-3 w-3" />
                {planNameFilter}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            {usernameFilter && (
              <Badge
                variant="secondary"
                className="bg-[#ef7418]/10 text-[#ef7418] cursor-pointer"
                onClick={() => setUsernameFilter("")}
              >
                <User className="mr-1 h-3 w-3" />
                {usernameFilter}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
          </div>
        )}
      </header>

      {/* Results */}
      <div className="px-4 py-4">
        {query || activeFiltersCount > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {filteredPlans.length} {t.results}
              {query && ` para "${query}"`}
            </p>
            <div className="space-y-4">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onClick={() => onPlanSelect(plan)} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">{t.searchPlans}</h3>
            <p className="text-sm text-muted-foreground">{t.searchByLocation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
