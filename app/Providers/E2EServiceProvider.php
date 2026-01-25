<?php

namespace App\Providers;

use App\Services\FakeAIService;
use App\Services\FakeFortuneService;
use App\Services\OpenRouterService;
use Illuminate\Support\ServiceProvider;

class E2EServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Only register fake services when AI_DRIVER=fake
        if (config('e2e.ai_driver') === 'fake') {
            $this->app->singleton(OpenRouterService::class, function () {
                return new FakeAIService;
            });
        }

        // Register fake fortune service
        if (config('e2e.fortune_driver') === 'fake') {
            $this->app->singleton(FakeFortuneService::class, function () {
                return new FakeFortuneService;
            });
        }
    }

    public function boot(): void
    {
        // Time freezing is now handled at test-level via Time::freeze()
        // This avoids 419 cookie errors when E2E_NOW date passes
    }
}
