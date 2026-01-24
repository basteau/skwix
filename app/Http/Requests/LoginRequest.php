<?php

namespace App\Http\Requests;

use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest as FortifyLoginRequest;

class LoginRequest extends FortifyLoginRequest
{
    /**
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            Fortify::username() => 'required|string',
        ];
    }
}
