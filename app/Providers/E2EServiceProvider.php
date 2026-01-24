<?php

namespace App\Providers;

use App\Services\FakeAIService;
use App\Services\FakeFortuneService;
use App\Services\OpenRouterService;
use Carbon\Carbon;
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
        // Freeze time if E2E_NOW is set
        $now = config('e2e.now');
        if ($now) {
            Carbon::setTestNow(Carbon::parse($now));
        }
    }
}
