import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Horse,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const stats = [
    {
      label: "Total de Cavalos",
      value: "24",
      icon: Horse,
      color: "text-blue-600",
    },
    {
      label: "Proprietários",
      value: "12",
      icon: Users,
      color: "text-green-600",
    },
    {
      label: "Coberturas este Mês",
      value: "8",
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      label: "Receita do Mês",
      value: "R$ 45.000",
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ];

  const recentActivity = [
    {
      type: "cobertura",
      message: "Cobertura agendada para Ega Delta",
      time: "2 horas atrás",
    },
    {
      type: "venda",
      message: "Cavalo vendido - DL Dom Cristiano",
      time: "1 dia atrás",
    },
    {
      type: "alerta",
      message: "Vacina vencida - Bao da Serra",
      time: "2 dias atrás",
    },
    {
      type: "leilao",
      message: "Leilão confirmado para Marco",
      time: "3 dias atrás",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name || "Usuário"}!
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Modo Desenvolvimento</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {activity.type === "cobertura" && (
                      <Calendar className="h-4 w-4 text-purple-500" />
                    )}
                    {activity.type === "venda" && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {activity.type === "alerta" && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {activity.type === "leilao" && (
                      <Horse className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Haras</CardTitle>
            <CardDescription>Dados do haras associado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Haras ID
                </p>
                <p className="text-lg font-semibold">
                  {user?.harasId || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Função
                </p>
                <p className="text-lg font-semibold capitalize">
                  {user?.role || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  OpenID
                </p>
                <p className="text-sm font-mono">{user?.openId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Método Login
                </p>
                <p className="text-lg font-semibold">
                  {user?.loginMethod || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Eventos agendados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento agendado</p>
            <p className="text-sm">Adicione eventos para vê-los aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
