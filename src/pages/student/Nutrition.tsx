import { Apple, Droplets, Flame, Clock, ChevronRight, Utensils, Coffee, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dailyMeals = [
  { 
    meal: "Pequeno-almoço", 
    time: "07:30", 
    icon: Coffee,
    foods: [
      { name: "Ovos mexidos", portion: "3 unidades", calories: 210, protein: 18 },
      { name: "Aveia com fruta", portion: "80g + 1 banana", calories: 280, protein: 8 },
      { name: "Sumo de laranja natural", portion: "200ml", calories: 90, protein: 1 },
    ]
  },
  { 
    meal: "Lanche da Manhã", 
    time: "10:30", 
    icon: Apple,
    foods: [
      { name: "Iogurte grego natural", portion: "170g", calories: 100, protein: 17 },
      { name: "Nozes", portion: "30g", calories: 185, protein: 4 },
    ]
  },
  { 
    meal: "Almoço", 
    time: "13:00", 
    icon: Utensils,
    foods: [
      { name: "Peito de frango grelhado", portion: "200g", calories: 330, protein: 62 },
      { name: "Arroz integral", portion: "150g", calories: 165, protein: 4 },
      { name: "Legumes salteados", portion: "200g", calories: 80, protein: 3 },
      { name: "Azeite", portion: "1 colher", calories: 120, protein: 0 },
    ]
  },
  { 
    meal: "Lanche da Tarde", 
    time: "16:30", 
    icon: Sun,
    foods: [
      { name: "Batido de proteína", portion: "1 dose", calories: 120, protein: 24 },
      { name: "Banana", portion: "1 unidade", calories: 105, protein: 1 },
      { name: "Manteiga de amendoim", portion: "20g", calories: 120, protein: 5 },
    ]
  },
  { 
    meal: "Jantar", 
    time: "20:00", 
    icon: Moon,
    foods: [
      { name: "Salmão grelhado", portion: "180g", calories: 370, protein: 40 },
      { name: "Batata-doce", portion: "200g", calories: 180, protein: 4 },
      { name: "Salada mista", portion: "150g", calories: 35, protein: 2 },
    ]
  },
];

const weeklyPlan = [
  { day: "Segunda", focus: "Hipertrofia", calories: 2800, protein: 180 },
  { day: "Terça", focus: "Hipertrofia", calories: 2800, protein: 180 },
  { day: "Quarta", focus: "Recuperação", calories: 2400, protein: 160 },
  { day: "Quinta", focus: "Hipertrofia", calories: 2800, protein: 180 },
  { day: "Sexta", focus: "Hipertrofia", calories: 2800, protein: 180 },
  { day: "Sábado", focus: "Treino Leve", calories: 2600, protein: 170 },
  { day: "Domingo", focus: "Descanso", calories: 2200, protein: 150 },
];

export default function NutritionPlan() {
  const totalCalories = dailyMeals.reduce((acc, meal) => 
    acc + meal.foods.reduce((a, f) => a + f.calories, 0), 0
  );
  const totalProtein = dailyMeals.reduce((acc, meal) => 
    acc + meal.foods.reduce((a, f) => a + f.protein, 0), 0
  );

  return (
    <div className="space-y-6">
        {/* Daily Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Calorias</p>
                  <p className="text-lg md:text-2xl font-bold text-foreground">{totalCalories}</p>
                  <p className="text-xs text-muted-foreground">/ 2800 kcal</p>
                </div>
              </div>
              <Progress value={(totalCalories / 2800) * 100} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-blue-500">P</span>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Proteína</p>
                  <p className="text-lg md:text-2xl font-bold text-foreground">{totalProtein}g</p>
                  <p className="text-xs text-muted-foreground">/ 180g</p>
                </div>
              </div>
              <Progress value={(totalProtein / 180) * 100} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Água</p>
                  <p className="text-lg md:text-2xl font-bold text-foreground">2.5L</p>
                  <p className="text-xs text-muted-foreground">/ 3L</p>
                </div>
              </div>
              <Progress value={83} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-orange-500">C</span>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Hidratos</p>
                  <p className="text-lg md:text-2xl font-bold text-foreground">320g</p>
                  <p className="text-xs text-muted-foreground">/ 350g</p>
                </div>
              </div>
              <Progress value={91} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex">
            <TabsTrigger value="today">Plano de Hoje</TabsTrigger>
            <TabsTrigger value="week">Plano Semanal</TabsTrigger>
          </TabsList>

          {/* Today's Plan */}
          <TabsContent value="today" className="mt-4 md:mt-6">
            <div className="space-y-4">
              {dailyMeals.map((meal, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2 px-4 md:px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <meal.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        <span>{meal.meal}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-xs md:text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {meal.time}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6 pb-4">
                    <div className="space-y-2">
                      {meal.foods.map((food, foodIndex) => (
                        <div 
                          key={foodIndex}
                          className="flex items-center justify-between p-2 md:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm md:text-base truncate">{food.name}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{food.portion}</p>
                          </div>
                          <div className="flex gap-2 md:gap-4 text-right ml-2">
                            <div>
                              <p className="text-xs text-muted-foreground">kcal</p>
                              <p className="font-semibold text-foreground text-sm">{food.calories}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">prot</p>
                              <p className="font-semibold text-primary text-sm">{food.protein}g</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
                      <span className="text-muted-foreground">Total da refeição</span>
                      <div className="flex gap-4">
                        <span className="font-semibold">{meal.foods.reduce((a, f) => a + f.calories, 0)} kcal</span>
                        <span className="font-semibold text-primary">{meal.foods.reduce((a, f) => a + f.protein, 0)}g prot</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Weekly Plan */}
          <TabsContent value="week" className="mt-4 md:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {weeklyPlan.map((day, index) => (
                <Card 
                  key={index}
                  className={`hover:shadow-lg transition-all ${day.day === "Quinta" ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={day.day === "Quinta" ? "default" : "secondary"}>
                        {day.day}
                      </Badge>
                      {day.day === "Quinta" && (
                        <Badge variant="outline" className="border-primary text-primary text-xs">Hoje</Badge>
                      )}
                    </div>
                    <p className="font-medium text-foreground mb-2">{day.focus}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calorias</span>
                        <span className="font-semibold">{day.calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proteína</span>
                        <span className="font-semibold text-primary">{day.protein}g</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Dicas do Nutricionista</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bebe água regularmente ao longo do dia, não esperes ter sede.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Faz a refeição pós-treino até 1 hora após o exercício.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Evita alimentos processados e açúcares adicionados.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Prepara as refeições com antecedência para garantir consistência.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
