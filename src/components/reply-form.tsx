
"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReplyFormProps {
  reviewId: string;
  userId: string;
  onReplySubmitted: () => void;
}

export function ReplyForm({ reviewId, userId, onReplySubmitted }: ReplyFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({ variant: "destructive", title: "Reply cannot be empty." });
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase
      .from("review_replies")
      .insert({
        review_id: reviewId,
        user_id: userId,
        comment: comment.trim(),
      });

    setIsSubmitting(false);

    if (error) {
      toast({ variant: "destructive", title: "Error submitting reply", description: error.message });
      console.error("Reply Submission Error:", error);
    } else {
      setComment("");
      onReplySubmitted();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className="bg-muted/50"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !comment.trim()} size="sm">
            {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Send className="mr-2 h-4 w-4" />
            )}
            Post Reply
        </Button>
      </div>
    </form>
  );
}
