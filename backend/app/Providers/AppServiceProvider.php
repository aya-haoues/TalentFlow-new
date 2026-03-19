<?php

namespace App\Providers;

use App\Models\Application;
use App\Models\Job;
use App\Models\User;           
use App\Policies\ApplicationPolicy;
use App\Policies\JobPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;
use App\Services\AuthService;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Auth\Notifications\ResetPassword;


class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuthService::class);
    }

    public function boot(): void
    {
        // ── LinkedIn OAuth ──
        Event::listen(function (SocialiteWasCalled $event) {
            $event->extendSocialite('linkedin-openid',
                \SocialiteProviders\LinkedIn\Provider::class
            );
        });

        // ── Rate Limiters ──
        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip());
        });

        // ── Policies ──
        Gate::policy(Job::class, JobPolicy::class);
        Gate::policy(Application::class, ApplicationPolicy::class);

        // ── Admin bypass global ──
        Gate::before(function ($user, string $ability) {
            if ($user->role === 'admin') {
                return true;
            }
        });

        // ── Email de vérification personnalisé ──
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Vérifiez votre adresse email — TalentFlow')
                ->greeting('Bonjour ' . $notifiable->name . ' !')
                ->line('Merci de vous être inscrit sur TalentFlow.')
                ->line('Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.')
                ->action('Vérifier mon email', $url)
                ->line('Ce lien expire dans 60 minutes.')
                ->line('Si vous n\'avez pas créé de compte, ignorez cet email.')
                ->salutation('L\'équipe TalentFlow');
        });

        ResetPassword::createUrlUsing(function (User $user, string $token) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return "{$frontendUrl}/reset-password?token={$token}&email={$user->email}";
        });
    }
}