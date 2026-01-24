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
        $this->testGameService->exitTestMode();

        return redirect()->route('admin.dashboard');
    }

    public function reset(): RedirectResponse
    {
        $this->testGameService->resetTestGame();

        return redirect()->route('play.wordle');
    }
}
