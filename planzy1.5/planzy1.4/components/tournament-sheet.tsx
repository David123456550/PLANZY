"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Plus, Trash2 } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import type { TournamentTeam } from "@/lib/types"

interface TournamentSheetProps {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TEAM_COLORS = [
  { name: "Rojo", value: "#ef4444" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Naranja", value: "#f97316" },
  { name: "Morado", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Blanco", value: "#ffffff" },
  { name: "Negro", value: "#000000" },
]

const SPORTS = [
  { id: "football", labelEs: "Fútbol", labelEn: "Football" },
  { id: "basketball", labelEs: "Baloncesto", labelEn: "Basketball" },
  { id: "volleyball", labelEs: "Voleibol", labelEn: "Volleyball" },
  { id: "tennis", labelEs: "Tenis", labelEn: "Tennis" },
  { id: "padel", labelEs: "Pádel", labelEn: "Padel" },
  { id: "other", labelEs: "Otro", labelEn: "Other" },
]

export function TournamentSheet({ planId, open, onOpenChange }: TournamentSheetProps) {
  const { language, addTournament, premiumPlan } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()

  const [sport, setSport] = useState("")
  const [playersPerTeam, setPlayersPerTeam] = useState("")
  const [teams, setTeams] = useState<Omit<TournamentTeam, "id" | "players">[]>([])
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0].value)

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return
    setTeams([...teams, { name: newTeamName, color: newTeamColor }])
    setNewTeamName("")
    setNewTeamColor(TEAM_COLORS[teams.length % TEAM_COLORS.length].value)
  }

  const handleRemoveTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index))
  }

  const handleCreateTournament = () => {
    if (!sport || !playersPerTeam || teams.length < 2) {
      toast({
        title: "Error",
        description:
          language === "es"
            ? "Completa todos los campos y añade al menos 2 equipos"
            : "Complete all fields and add at least 2 teams",
        variant: "destructive",
      })
      return
    }

    const tournament = {
      id: `tournament-${Date.now()}`,
      planId,
      sport,
      playersPerTeam: Number.parseInt(playersPerTeam),
      teams: teams.map((team, idx) => ({
        ...team,
        id: `team-${idx}-${Date.now()}`,
        players: [],
      })),
      createdAt: new Date(),
    }

    addTournament(tournament)

    toast({
      title: t.tournamentCreated,
      description:
        language === "es"
          ? `Torneo de ${SPORTS.find((s) => s.id === sport)?.[language === "es" ? "labelEs" : "labelEn"]} creado`
          : `${SPORTS.find((s) => s.id === sport)?.[language === "es" ? "labelEs" : "labelEn"]} tournament created`,
    })

    // Reset form
    setSport("")
    setPlayersPerTeam("")
    setTeams([])
    onOpenChange(false)
  }

  if (premiumPlan !== "club") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#1a95a4]" />
              {t.createTournament}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {language === "es" ? "Función exclusiva Club" : "Club exclusive feature"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === "es"
                ? "Actualiza al plan Club para crear torneos dentro de tus planes"
                : "Upgrade to Club plan to create tournaments in your plans"}
            </p>
            <Button className="bg-[#1a95a4] hover:bg-[#1a95a4]/90">{t.upgradePlan}</Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#1a95a4]" />
            {t.createTournament}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(85vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Sport selection */}
            <div className="space-y-2">
              <Label>{t.sportType}</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectSport} />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {language === "es" ? s.labelEs : s.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Players per team */}
            <div className="space-y-2">
              <Label>{t.playersPerTeam}</Label>
              <Input
                type="number"
                placeholder="5"
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(e.target.value)}
                min={1}
                max={20}
              />
            </div>

            {/* Teams */}
            <div className="space-y-4">
              <Label>
                {language === "es" ? "Equipos" : "Teams"} ({teams.length})
              </Label>

              {teams.length > 0 && (
                <div className="space-y-2">
                  {teams.map((team, idx) => (
                    <Card key={idx}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: team.color }} />
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleRemoveTeam(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add team form */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>{t.teamName}</Label>
                    <Input
                      placeholder={language === "es" ? "Nombre del equipo" : "Team name"}
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.teamColor}</Label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            newTeamColor === color.value ? "scale-110 ring-2 ring-[#ef7418]" : ""
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setNewTeamColor(color.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleAddTeam}
                    disabled={!newTeamName.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t.addTeam}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Button
              className="w-full bg-[#1a95a4] hover:bg-[#1a95a4]/90"
              onClick={handleCreateTournament}
              disabled={!sport || !playersPerTeam || teams.length < 2}
            >
              <Trophy className="mr-2 h-4 w-4" />
              {t.createTournament}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
