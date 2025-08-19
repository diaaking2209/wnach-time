
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
  onReplySubmitted: (reviewId: string, replyComment: string) => void;
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
      .from("reviews")
      .update({
        reply_comment: comment.trim(),
        reply_admin_id: userId,
        reply_created_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    setIsSubmitting(false);

    if (error) {
      toast({ variant: "destructive", title: "Error submitting reply", description: error.message });
      console.error("Reply Submission Error:", error);
    } else {
      const submittedComment = comment.trim();
      setComment("");
      onReplySubmitted(reviewId, submittedComment);
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
