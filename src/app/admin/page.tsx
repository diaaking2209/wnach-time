
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>
            Welcome to the admin panel. Here you can manage products, users, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Admin features will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
