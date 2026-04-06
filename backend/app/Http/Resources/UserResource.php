<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'role'           => $this->role,
            'telephone'      => $this->telephone,
            'avatar'         => $this->avatar,
            'linkedin_url'   => $this->linkedin_url,
            'is_social'      => $this->isSocialAccount(),
            'email_verified' => !is_null($this->email_verified_at),

            // ── Seulement pour admin ───────────────
            'is_approved' => $this->when(
                $request->user()?->role === 'admin',
                $this->is_approved
            ),
            'is_blocked' => $this->when(
                $request->user()?->role === 'admin',
                $this->is_blocked
            ),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}