<?php

namespace App\Http\Controllers;

use App\Services\TestGameService;
use Illuminate\Http\RedirectResponse;

class TestGameController extends Controller
{
    public function __construct(
        private TestGameService $testGameService,
    ) {}

    public function start(): RedirectResponse
    {
        $this->testGameService->startTestGame();

        return redirect()->route('play.wordle');
    }

    public function exit(): RedirectResponse
    {
        if (! $this->testGameService->isTestMode()) {
            return redirect()->route('admin.dashboard');
        }

        $this->testGameService->exitTestMode();

        return redirect()->route('admin.dashboard');
    }

    public function reset(): RedirectResponse
    {
        if (! $this->testGameService->isTestMode()) {
            return redirect()->route('play.wordle');
        }

        $this->testGameService->resetTestGame();

        return redirect()->route('play.wordle');
    }
}
