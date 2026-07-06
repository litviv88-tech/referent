import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorDisplay, type ApiErrorCode } from "@/lib/errors";

type ErrorAlertProps = {
  code: ApiErrorCode;
  className?: string;
};

export function ErrorAlert({ code, className }: ErrorAlertProps) {
  const { title, description } = getErrorDisplay(code);

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="break-words">{title}</AlertTitle>
      {description && (
        <AlertDescription className="break-words">{description}</AlertDescription>
      )}
    </Alert>
  );
}
