
"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "./ui/use-toast";

interface ReplyFormProps {
  reviewId: string;
  onReplySubmitted: () => void;
}

export function ReplyForm({ reviewId, onReplySubmitted }: ReplyFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) {
      return;
    }
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from("review_replies")
      .insert({
        review_id: reviewId,
        user_id: user.id,
        comment: comment.trim(),
      });

    setIsSubmitting(false);

    if (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to submit reply. " + error.message,
        });
        console.error("Reply Submission Error:", error);
    } else {
        toast({
            title: "Reply Submitted!",
            description: "Your reply has been posted.",
        });
        setComment("");
        onReplySubmitted();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-start gap-2">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a reply..."
        rows={1}
        className="flex-grow"
        required
      />
      <Button type="submit" disabled={isSubmitting || !comment.trim()} size="sm">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reply
      </Button>
    </form>
  );
}

