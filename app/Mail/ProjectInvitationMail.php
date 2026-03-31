<?php

namespace App\Mail;

use App\Models\Project;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\ProjectInvitation;
use App\Models\User;


class ProjectInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;
    public $project;
    public $inviter;
    public $acceptUrl;

    public function __construct(ProjectInvitation $invitation, Project $project, User $inviter)
    {
        $this->invitation = $invitation;
        $this->project = $project;
        $this->inviter = $inviter;
        $this->acceptUrl = route('invitations.accept', $invitation->token);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitación para unirte al proyecto ' . $this->project->name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.project-invitation',
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
