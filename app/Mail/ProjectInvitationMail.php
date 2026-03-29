<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

use App\Models\ProjectInvitation;

class ProjectInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public ProjectInvitation $invitation
    ) {

    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Te invitaron al proyecto: {$this->invitation->project->name}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $url = route('invitation.accept', ['token' => $this->invitation->token]);

        return new Content(
            view: 'emails.project-invitation',
            with: [
                'url' => $url,
                'projectName' => $this->invitation->project->name,
                'invitedBy' => $this->invitation->invitedBy->name,
                'expiresAt' => $this->invitation->expires_at->translatedFormat('d M Y, H:i'),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
